const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function replaceInFile(filePath) {
    if (!filePath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace #0d2702 with primary-dark
    content = content.replace(/bg-\[\#0d2702\]/g, 'bg-primary-dark');
    content = content.replace(/text-\[\#0d2702\]/g, 'text-primary-dark');
    content = content.replace(/border-\[\#0d2702\]/g, 'border-primary-dark');
    content = content.replace(/hover:bg-\[\#0d2702\]/g, 'hover:bg-primary-dark');
    content = content.replace(/hover:text-\[\#0d2702\]/g, 'hover:text-primary-dark');
    content = content.replace(/focus:border-\[\#0d2702\]/g, 'focus:border-primary-dark');
    content = content.replace(/focus:ring-\[\#0d2702\]/g, 'focus:ring-primary-dark');
    content = content.replace(/ring-\[\#0d2702\]/g, 'ring-primary-dark');
    
    // Also handle opacity like text-[#0d2702]/80 -> text-primary-dark/80
    content = content.replace(/bg-\[\#0d2702\]\/(\d+)/g, 'bg-primary-dark/$1');
    content = content.replace(/text-\[\#0d2702\]\/(\d+)/g, 'text-primary-dark/$1');
    
    // Replace #71d300 with primary
    content = content.replace(/bg-\[\#71d300\]/g, 'bg-primary');
    content = content.replace(/text-\[\#71d300\]/g, 'text-primary');
    content = content.replace(/border-\[\#71d300\]/g, 'border-primary');
    content = content.replace(/hover:bg-\[\#71d300\]/g, 'hover:bg-primary');
    content = content.replace(/hover:text-\[\#71d300\]/g, 'hover:text-primary');
    content = content.replace(/focus:border-\[\#71d300\]/g, 'focus:border-primary');
    content = content.replace(/focus:ring-\[\#71d300\]/g, 'focus:ring-primary');
    content = content.replace(/ring-\[\#71d300\]/g, 'ring-primary');

    // Also handle opacity like bg-[#71d300]/15 -> bg-primary/15
    content = content.replace(/bg-\[\#71d300\]\/(\d+)/g, 'bg-primary/$1');
    content = content.replace(/text-\[\#71d300\]\/(\d+)/g, 'text-primary/$1');
    content = content.replace(/border-\[\#71d300\]\/(\d+)/g, 'border-primary/$1');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

walkDir(path.join(__dirname, 'src'), replaceInFile);
console.log('Done replacing colors.');
