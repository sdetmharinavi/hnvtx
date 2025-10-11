import re

def clean_file(input_file, output_file=None):
    if output_file is None:
        output_file = input_file + '.cleaned'
        
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    cleaned_lines = []
    in_block_comment = False
    
    for line in lines:
        stripped = line.strip()
        
        # Check for block comments
        if '/*' in line and '*/' not in line:
            in_block_comment = True
            continue
            
        if '*/' in line and in_block_comment:
            in_block_comment = False
            continue
            
        if in_block_comment:
            continue
            
        # Keep lines that are not comments or are special comments we want to keep
        if (not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*')) or \
           stripped.startswith('<!-- path:') or \
           stripped.startswith('// ====='):
            cleaned_lines.append(line)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)
    
    # Replace original file if output_file was not specified
    if output_file.endswith('.cleaned'):
        import shutil
        shutil.move(output_file, input_file)

if __name__ == "__main__":
    input_file = "/home/au/Desktop/git_projects/newhnvtx/hnvtx/scripts/output.md"
    clean_file(input_file)
