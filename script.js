document.addEventListener('DOMContentLoaded', function() {
    const markdownInput = document.getElementById('markdown-input');
    const previewOutput = document.getElementById('preview-output');
    
    // 配置 marked 选项
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: function(code, lang) {
            if (typeof hljs !== 'undefined') {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {}
                }
                try {
                    return hljs.highlightAuto(code).value;
                } catch (err) {}
            }
            return code; // 如果 hljs 未定义，返回原始代码
        },
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        xhtml: false
    });
    
    // 初始化预览
    updatePreview();
    
    // 监听输入变化
    markdownInput.addEventListener('input', updatePreview);
    
    // 监听粘贴事件，处理富文本转换为 Markdown
    markdownInput.addEventListener('paste', function(e) {
        // 如果粘贴的内容包含 HTML 格式
        if (e.clipboardData && e.clipboardData.getData('text/html')) {
            e.preventDefault(); // 阻止默认粘贴行为
            
            const html = e.clipboardData.getData('text/html');
            const markdown = convertHtmlToMarkdown(html);
            
            // 在光标位置插入转换后的 Markdown
            const startPos = this.selectionStart;
            const endPos = this.selectionEnd;
            this.value = this.value.substring(0, startPos) + markdown + this.value.substring(endPos);
            
            // 更新光标位置
            this.selectionStart = this.selectionEnd = startPos + markdown.length;
            
            // 更新预览
            updatePreview();
        }
    });
    
    // 将 HTML 转换为 Markdown
    function convertHtmlToMarkdown(html) {
        // 创建一个临时的 DOM 元素来解析 HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // 递归处理 DOM 节点
        function processNode(node) {
            let result = '';
            
            // 处理文本节点
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            
            // 处理元素节点
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                const childContent = Array.from(node.childNodes).map(processNode).join('');
                
                // 根据不同的标签应用不同的 Markdown 格式
                switch (tagName) {
                    case 'h1': return `# ${childContent}\n\n`;
                    case 'h2': return `## ${childContent}\n\n`;
                    case 'h3': return `### ${childContent}\n\n`;
                    case 'h4': return `#### ${childContent}\n\n`;
                    case 'h5': return `##### ${childContent}\n\n`;
                    case 'h6': return `###### ${childContent}\n\n`;
                    case 'p': return `${childContent}\n\n`;
                    case 'strong':
                    case 'b': return `**${childContent}**`;
                    case 'em':
                    case 'i': return `*${childContent}*`;
                    case 'a': return `[${childContent}](${node.getAttribute('href') || ''})`;
                    case 'img': return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
                    case 'code': return `\`${childContent}\``;
                    case 'pre': return `\`\`\`\n${childContent}\n\`\`\`\n\n`;
                    case 'ul': {
                        const items = Array.from(node.children).map(li => `- ${processNode(li).trim()}`).join('\n');
                        return `${items}\n\n`;
                    }
                    case 'ol': {
                        const items = Array.from(node.children).map((li, index) => `${index + 1}. ${processNode(li).trim()}`).join('\n');
                        return `${items}\n\n`;
                    }
                    case 'li': return childContent;
                    case 'blockquote': return `> ${childContent}\n\n`;
                    case 'hr': return `---\n\n`;
                    case 'table': {
                        let tableContent = '';
                        const rows = Array.from(node.rows);
                        
                        // 处理表头
                        if (rows.length > 0) {
                            const headerCells = Array.from(rows[0].cells);
                            tableContent += '| ' + headerCells.map(cell => processNode(cell).trim()).join(' | ') + ' |\n';
                            tableContent += '| ' + headerCells.map(() => '---').join(' | ') + ' |\n';
                            
                            // 处理表格内容
                            for (let i = 1; i < rows.length; i++) {
                                const cells = Array.from(rows[i].cells);
                                tableContent += '| ' + cells.map(cell => processNode(cell).trim()).join(' | ') + ' |\n';
                            }
                        }
                        
                        return tableContent + '\n';
                    }
                    case 'br': return '\n';
                    case 'div': return childContent;
                    case 'span': return childContent;
                    default: return childContent;
                }
            }
            
            return '';
        }
        
        return processNode(tempDiv).trim();
    }
    
    // 更新预览函数
    function updatePreview() {
        const markdownText = markdownInput.value;
        const htmlContent = marked.parse(markdownText);
        previewOutput.innerHTML = htmlContent;
        
        // 高亮代码块
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('#preview-output pre code').forEach((block) => {
                try {
                    hljs.highlightBlock(block);
                } catch (err) {
                    console.log('代码高亮失败:', err);
                }
            });
        }
    }
    
    // 工具栏按钮功能
    document.getElementById('btn-bold').addEventListener('click', function() {
        insertText('**粗体文本**', 2, 6);
    });
    
    document.getElementById('btn-italic').addEventListener('click', function() {
        insertText('*斜体文本*', 1, 5);
    });
    
    document.getElementById('btn-heading').addEventListener('click', function() {
        insertText('## 标题', 3, 5);
    });
    
    document.getElementById('btn-link').addEventListener('click', function() {
        insertText('[链接文本](https://example.com)', 1, 5);
    });
    
    document.getElementById('btn-image').addEventListener('click', function() {
        insertText('![图片描述](https://example.com/image.jpg)', 2, 6);
    });
    
    document.getElementById('btn-list').addEventListener('click', function() {
        insertText('- 列表项 1\n- 列表项 2\n- 列表项 3', 2, 6);
    });
    
    document.getElementById('btn-code').addEventListener('click', function() {
        insertText('```javascript\n// 代码示例\nconsole.log("Hello World");\n```', 3, 13);
    });
    
    document.getElementById('btn-quote').addEventListener('click', function() {
        insertText('> 引用文本', 2, 6);
    });
    
    document.getElementById('btn-hr').addEventListener('click', function() {
        insertText('\n---\n', 0, 0);
    });
    
    document.getElementById('btn-table').addEventListener('click', function() {
        insertText('| 表头 1 | 表头 2 | 表头 3 |\n| --- | --- | --- |\n| 单元格 1 | 单元格 2 | 单元格 3 |\n| 单元格 4 | 单元格 5 | 单元格 6 |', 2, 6);
    });
    
    document.getElementById('btn-clear').addEventListener('click', function() {
        if (confirm('确定要清空编辑器内容吗？')) {
            markdownInput.value = '';
            updatePreview();
        }
    });
    
    document.getElementById('btn-copy').addEventListener('click', function() {
        const htmlContent = previewOutput.innerHTML;
        copyToClipboard(htmlContent);
        alert('HTML 内容已复制到剪贴板');
    });
    
    document.getElementById('btn-download-md').addEventListener('click', function() {
        downloadFile('markdown.md', markdownInput.value);
    });
    
    document.getElementById('btn-download-html').addEventListener('click', function() {
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Markdown 导出</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        pre {
            background-color: #f6f8fa;
            border-radius: 3px;
            padding: 16px;
            overflow: auto;
        }
        code {
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            background-color: rgba(27, 31, 35, 0.05);
            border-radius: 3px;
            padding: 0.2em 0.4em;
            font-size: 85%;
        }
        pre code {
            background-color: transparent;
            padding: 0;
        }
        blockquote {
            padding: 0 1rem;
            color: #6a737d;
            border-left: 0.25rem solid #dfe2e5;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        table th, table td {
            padding: 6px 13px;
            border: 1px solid #dfe2e5;
        }
        img {
            max-width: 100%;
        }
    </style>
</head>
<body>
    ${previewOutput.innerHTML}
</body>
</html>`;
        downloadFile('markdown.html', htmlContent);
    });
    
    // 辅助函数：在光标位置插入文本
    function insertText(text, selectionStart, selectionLength) {
        const startPos = markdownInput.selectionStart;
        const endPos = markdownInput.selectionEnd;
        const scrollTop = markdownInput.scrollTop;
        
        if (startPos !== endPos) {
            // 如果有选中文本，将其替换为带格式的文本
            const selectedText = markdownInput.value.substring(startPos, endPos);
            const formattedText = text.replace(/文本|链接文本|图片描述|代码示例|引用文本|列表项 1/, selectedText);
            markdownInput.value = markdownInput.value.substring(0, startPos) + formattedText + markdownInput.value.substring(endPos);
            markdownInput.selectionStart = startPos;
            markdownInput.selectionEnd = startPos + formattedText.length;
        } else {
            // 如果没有选中文本，直接插入格式文本
            markdownInput.value = markdownInput.value.substring(0, startPos) + text + markdownInput.value.substring(endPos);
            if (selectionStart !== undefined && selectionLength !== undefined) {
                markdownInput.selectionStart = startPos + selectionStart;
                markdownInput.selectionEnd = startPos + selectionStart + selectionLength;
            } else {
                markdownInput.selectionStart = markdownInput.selectionEnd = startPos + text.length;
            }
        }
        
        markdownInput.focus();
        markdownInput.scrollTop = scrollTop;
        updatePreview();
    }
    
    // 辅助函数：复制到剪贴板
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    // 辅助函数：下载文件
    function downloadFile(filename, content) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    
    // 添加一些示例 Markdown 内容
    markdownInput.value = `# Markdown 在线编辑器

这是一个简单的 **Markdown** 在线编辑器示例。

## 功能特点

- 实时预览
- 语法高亮
- 导出 HTML
- 导出 Markdown

## 代码示例

\`\`\`javascript
function hello() {
    console.log("Hello, Markdown!");
}
\`\`\`

## 表格示例

| 功能 | 描述 |
| --- | --- |
| 实时预览 | 边写边看效果 |
| 语法高亮 | 代码高亮显示 |

> 这是一个引用示例。

![Markdown Logo](https://markdown-here.com/img/icon256.png)

---

欢迎使用 Markdown 在线编辑器！
`;
    updatePreview();
});