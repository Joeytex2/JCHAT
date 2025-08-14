const fs = require('fs');
const path = require('path');

// Common JavaScript error patterns to check for
const errorPatterns = [
    {
        name: 'Duplicate const declarations',
        pattern: /const\s+(\w+)\s*=\s*document\.getElementById/g,
        check: (content, filename) => {
            const matches = content.match(/const\s+(\w+)\s*=\s*document\.getElementById/g);
            if (matches) {
                const vars = matches.map(m => m.match(/const\s+(\w+)/)[1]);
                const duplicates = vars.filter((v, i) => vars.indexOf(v) !== i);
                if (duplicates.length > 0) {
                    return `Duplicate const declarations: ${[...new Set(duplicates)].join(', ')}`;
                }
            }
            return null;
        }
    },
    {
        name: 'Duplicate function declarations',
        pattern: /function\s+(\w+)\s*\(/g,
        check: (content, filename) => {
            const matches = content.match(/function\s+(\w+)\s*\(/g);
            if (matches) {
                const funcs = matches.map(m => m.match(/function\s+(\w+)/)[1]);
                const duplicates = funcs.filter((f, i) => funcs.indexOf(f) !== i);
                if (duplicates.length > 0) {
                    return `Duplicate function declarations: ${[...new Set(duplicates)].join(', ')}`;
                }
            }
            return null;
        }
    },
    {
        name: 'Duplicate let/var declarations',
        pattern: /(let|var)\s+(\w+)\s*=/g,
        check: (content, filename) => {
            const matches = content.match(/(let|var)\s+(\w+)\s*=/g);
            if (matches) {
                const vars = matches.map(m => m.match(/(let|var)\s+(\w+)/)[2]);
                const duplicates = vars.filter((v, i) => vars.indexOf(v) !== i);
                if (duplicates.length > 0) {
                    return `Duplicate let/var declarations: ${[...new Set(duplicates)].join(', ')}`;
                }
            }
            return null;
        }
    },
    {
        name: 'Unclosed script tags',
        pattern: /<script[^>]*>/g,
        check: (content, filename) => {
            const openScripts = (content.match(/<script[^>]*>/g) || []).length;
            const closeScripts = (content.match(/<\/script>/g) || []).length;
            if (openScripts !== closeScripts) {
                return `Unmatched script tags: ${openScripts} open, ${closeScripts} close`;
            }
            return null;
        }
    },
    {
        name: 'Unclosed HTML tags',
        pattern: /<[^>]*>/g,
        check: (content, filename) => {
            const openTags = content.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g) || [];
            const closeTags = content.match(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g) || [];
            
            const openTagNames = openTags.map(t => t.match(/<([a-zA-Z][a-zA-Z0-9]*)/)[1]);
            const closeTagNames = closeTags.map(t => t.match(/<\/([a-zA-Z][a-zA-Z0-9]*)/)[1]);
            
            // Check for common unclosed tags
            const commonTags = ['div', 'span', 'p', 'section', 'header', 'main', 'footer'];
            for (const tag of commonTags) {
                const openCount = openTagNames.filter(n => n === tag).length;
                const closeCount = closeTagNames.filter(n => n === tag).length;
                if (openCount !== closeCount) {
                    return `Unmatched ${tag} tags: ${openCount} open, ${closeCount} close`;
                }
            }
            return null;
        }
    }
];

// Function to check a single file
function checkFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const errors = [];
        
        for (const pattern of errorPatterns) {
            const error = pattern.check(content, filePath);
            if (error) {
                errors.push(`${pattern.name}: ${error}`);
            }
        }
        
        return {
            file: filePath,
            errors: errors,
            hasErrors: errors.length > 0
        };
    } catch (err) {
        return {
            file: filePath,
            errors: [`File read error: ${err.message}`],
            hasErrors: true
        };
    }
}

// Main function to check all HTML files
function checkAllFiles() {
    const htmlFiles = [];
    
    // Find all HTML files
    function findHtmlFiles(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                findHtmlFiles(fullPath);
            } else if (item.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    }
    
    findHtmlFiles('.');
    
    console.log(`Found ${htmlFiles.length} HTML files to check...\n`);
    
    const results = [];
    let totalErrors = 0;
    
    for (const file of htmlFiles) {
        const result = checkFile(file);
        results.push(result);
        if (result.hasErrors) {
            totalErrors += result.errors.length;
            console.log(`❌ ${result.file}`);
            result.errors.forEach(error => console.log(`   - ${error}`));
            console.log('');
        } else {
            console.log(`✅ ${result.file}`);
        }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total files checked: ${htmlFiles.length}`);
    console.log(`Files with errors: ${results.filter(r => r.hasErrors).length}`);
    console.log(`Total errors found: ${totalErrors}`);
    
    // Return files that need fixing
    return results.filter(r => r.hasErrors);
}

// Run the check
const filesWithErrors = checkAllFiles();

// Export for potential use in fixing
module.exports = { checkFile, checkAllFiles, filesWithErrors };