function c(a){if(!a)return"";let t=String(a);return t=t.replace(/\\{1,2}\[\s*([\s\S]*?)\s*\\{1,2}\]/g,(n,e)=>`

$$
${e.trim()}
$$

`),t=t.replace(/\\{1,2}\(\s*([\s\S]*?)\s*\\{1,2}\)/g,(n,e)=>`$${e.trim()}$`),t=t.replace(/\[\s*(\\?(?:frac|dfrac|sqrt|int|sum|prod|lim|cdot|vec|overrightarrow|alpha|beta|gamma|delta|Delta|pi|infty|times|div|partial|le|ge|ne|approx|in|notin|subset|cup|cap|to|rightarrow|log|ln|sin|cos|tan|cot)[\s\S]*?)\s*\]/g,(n,e)=>{let r=e.trim(),s="";return(r.endsWith(",")||r.endsWith(";")||r.endsWith("."))&&(s=r.slice(-1),r=r.slice(0,-1).trim()),`$${r.startsWith("\\")?r:"\\"+r}$${s}`}),t=t.replace(new RegExp("(?<!\\$)(?:\\\\(?:frac|dfrac)\\{[^{}]+\\}\\{[^{}]+\\})(?!\\$)","g"),n=>`$${n}$`),t=t.replace(/([^\n])\s*(Bước\s+\d+[:.])/gi,`$1

**$2** `),t=t.replace(/^(Bước\s+\d+[:.])/gi,"**$1** "),t=t.replace(/([^\n])\s*(Vậy\s+đáp\s+án[\s\S]*)/gi,`$1

💡 **Kết luận:** $2`),t=t.replace(/\n{3,}/g,`

`).trim(),t}export{c as f};
