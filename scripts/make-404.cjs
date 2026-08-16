// GitHub Pages 的 SPA 兜底：把构建产物 index.html 复制为 404.html
// 否则直接访问/刷新子路径会显示 GitHub 的 404 页面
const fs = require('fs')
const path = require('path')

const dist = path.join(__dirname, '..', 'dist')
fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
console.log('404.html generated')
