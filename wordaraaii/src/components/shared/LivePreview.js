// src/components/shared/LivePreview.js
'use client';

import React, { useMemo } from 'react';
// --- START: Import the new JSX runtime ---
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
// --- END: Import the new JSX runtime ---
import katex from 'katex';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { unifiedLatexFromString } from '@unified-latex/unified-latex-util-parse';
import { visit } from '@unified-latex/unified-latex-util-visit';
import rehypeReact from 'rehype-react';

// This is a custom plugin to convert LaTeX AST to HAST (HTML AST)
const latexToHast = () => (tree, file) => {
  const hastRoot = { type: 'root', children: [] };
  const environmentStack = [hastRoot];
  const getCurrentEnv = () => environmentStack[environmentStack.length - 1];
  const titleData = {};

  visit(tree, {
    enter: (node) => {
      const currentEnv = getCurrentEnv();
      if (node.type === 'macro') {
        if (['title', 'author', 'date'].includes(node.content)) {
          titleData[node.content] = node.args.map(arg => arg.content.map(c => c.content).join('')).join('');
        }
        if (node.content === 'maketitle') {
            currentEnv.children.push({ type: 'element', tagName: 'div', properties: { className: 'maketitle' }, children: [
                { type: 'element', tagName: 'h1', children: [{ type: 'text', value: titleData.title || '' }] },
                { type: 'element', tagName: 'p', properties: {className: 'author'}, children: [{ type: 'text', value: titleData.author || '' }] },
                { type: 'element', tagName: 'p', properties: {className: 'date'}, children: [{ type: 'text', value: titleData.date || '' }] },
            ]});
        }
        if (['section', 'subsection'].includes(node.content)) {
          const tagName = node.content === 'section' ? 'h2' : 'h3';
          const titleText = node.args?.[0]?.content?.map(c => c.content).join('') || '';
          currentEnv.children.push({ type: 'element', tagName, children: [{ type: 'text', value: titleText }] });
        }
        if (['textbf', 'textit'].includes(node.content)) {
           const tagName = node.content === 'textbf' ? 'strong' : 'em';
           const textContent = node.args?.[0]?.content?.map(c => c.content).join('') || '';
           currentEnv.children.push({ type: 'element', tagName, children: [{ type: 'text', value: textContent }] });
        }
        if (node.content === 'item') {
           const textContent = node.args?.map(arg => arg.content.map(c => c.content).join('')).join('') || (node.contentAfterMacro?.trim() || '');
           currentEnv.children.push({ type: 'element', tagName: 'li', children: [{ type: 'text', value: textContent.trim() }] });
        }
      }
      if (node.type === 'string' && node.content.trim()) {
        currentEnv.children.push({ type: 'element', tagName: 'p', children: [{ type: 'text', value: node.content.trim() }] });
      }
      if (node.type === 'inlinemath' || node.type === 'displaymath') {
        try {
          const html = katex.renderToString(node.content, {
            throwOnError: false,
            displayMode: node.type === 'displaymath',
          });
          currentEnv.children.push({ type: 'element', tagName: 'span', properties: { dangerouslySetInnerHTML: { __html: html } } });
        } catch (e) {
          currentEnv.children.push({ type: 'element', tagName: 'span', properties: { className: 'text-red-400' }, children: [{ type: 'text', value: e.message }] });
        }
      }
      if (node.type === 'environment' && ['itemize', 'enumerate'].includes(node.env)) {
        const listEl = { type: 'element', tagName: node.env === 'itemize' ? 'ul' : 'ol', children: [] };
        currentEnv.children.push(listEl);
        environmentStack.push(listEl);
      }
    },
    leave: (node) => {
        if (node.type === 'environment' && ['itemize', 'enumerate'].includes(node.env)) {
            environmentStack.pop();
        }
    }
  });

  return hastRoot;
};

const processor = unified()
  .use(unifiedLatexFromString)
  .use(latexToHast)
  // --- START: Updated rehypeReact configuration ---
  .use(rehypeReact, {
      jsx: jsx,
      jsxs: jsxs,
      Fragment: Fragment,
      components: {
          h1: ({children}) => <h1 className="preview-h1">{children}</h1>,
          h2: ({children}) => <h2 className="preview-h2">{children}</h2>,
          h3: ({children}) => <h3 className="preview-h3">{children}</h3>,
      }
  });
  // --- END: Updated rehypeReact configuration ---


export default function LivePreview({ latexCode }) {
  const renderedContent = useMemo(() => {
    try {
      const vfile = new VFile(latexCode);
      const processed = processor.processSync(vfile);
      return processed.result;
    } catch (error) {
      console.error("LaTeX Parsing Error:", error);
      return <div className="p-4 text-red-400 bg-red-900/50 rounded-md">
        <h4 className="font-bold mb-2">Live Preview Failed</h4>
        <pre className="text-xs whitespace-pre-wrap">{error.message}</pre>
      </div>
    }
  }, [latexCode]);

  return <div className="live-preview-container p-8 bg-white text-gray-800 rounded-lg h-full overflow-y-auto scrollbar-themed">{renderedContent}</div>;
}