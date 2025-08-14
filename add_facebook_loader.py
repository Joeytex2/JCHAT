#!/usr/bin/env python3
import os
import re

def add_facebook_loader_to_html():
    """Add Facebook-style page loader to all HTML files"""
    
    # Get all HTML files
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    
    # Pattern to find insertion point (after existing scripts or before </head>)
    patterns = [
        # After Tone.js script
        (r'(<!--\s*Tone\.js.*?-->\s*<script.*?Tone\.js.*?</script>)', True),
        # After Font Awesome
        (r'(<!--\s*Font Awesome.*?-->\s*<link.*?font-awesome.*?/>)', True),
        # Before closing head
        (r'(</head>)', False)
    ]
    
    loader_script = '\n    <!-- Facebook-Style Page Loader -->\n    <script src="page-loader.js"></script>'
    
    updated_count = 0
    
    for html_file in html_files:
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Skip if already has the loader
            if 'page-loader.js' in content:
                print(f"Skipping {html_file} - already has loader")
                continue
            
            # Try to insert the loader
            inserted = False
            for pattern, append_after in patterns:
                match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
                if match:
                    if append_after:
                        # Insert after the matched content
                        start, end = match.span(1)
                        new_content = content[:end] + loader_script + content[end:]
                    else:
                        # Insert before the matched content
                        new_content = re.sub(pattern, loader_script + '\n    ' + r'\1', content, count=1, flags=re.IGNORECASE)
                    
                    with open(html_file, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    
                    print(f"Updated {html_file}")
                    updated_count += 1
                    inserted = True
                    break
            
            if not inserted:
                print(f"Could not find insertion point in {html_file}")
                
        except Exception as e:
            print(f"Error processing {html_file}: {e}")
    
    print(f"\nCompleted! Updated {updated_count} HTML files with Facebook-style page loader.")

if __name__ == '__main__':
    add_facebook_loader_to_html()