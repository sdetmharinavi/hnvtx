def filter_comments(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for line in lines:
            # Keep all non-comment lines
            if not line.strip().startswith('//') and not line.strip().startswith('/*') and not line.strip().startswith('*') and not line.strip().startswith('*/'):
                outfile.write(line)
            # Keep specific comment patterns
            elif line.strip().startswith('<!-- path:') or line.strip().startswith('// ========='):
                outfile.write(line)

if __name__ == "__main__":
    input_file = '/home/au/Desktop/git_projects/newhnvtx/hnvtx/scripts/output.md'
    temp_file = '/home/au/Desktop/git_projects/newhnvtx/hnvtx/scripts/output_filtered.md'
    
    filter_comments(input_file, temp_file)
    
    # Replace the original file with the filtered one
    import os
    os.replace(temp_file, input_file)
