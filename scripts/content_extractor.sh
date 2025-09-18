#!/bin/bash

# Prompt for folder name if not provided
if [ -z "$1" ]; then
    read -p "Enter folder name: " folder_name
else
    folder_name="$1"
fi

# Clear the output file
> output.md

find "$folder_name" -type f | while read file; do
    # Get file extension for syntax highlighting
    extension="${file##*.}"
    
    # Map common extensions to proper syntax highlighting names
    case "$extension" in
        "js"|"jsx") syntax="javascript" ;;
        "ts"|"tsx") syntax="typescript" ;;
        "py") syntax="python" ;;
        "sh") syntax="bash" ;;
        "yml"|"yaml") syntax="yaml" ;;
        "json") syntax="json" ;;
        "html") syntax="html" ;;
        "css") syntax="css" ;;
        "scss"|"sass") syntax="scss" ;;
        "md") syntax="markdown" ;;
        "sql") syntax="sql" ;;
        "xml") syntax="xml" ;;
        "java") syntax="java" ;;
        "c") syntax="c" ;;
        "cpp"|"cc"|"cxx") syntax="cpp" ;;
        "php") syntax="php" ;;
        "rb") syntax="ruby" ;;
        "go") syntax="go" ;;
        "rs") syntax="rust" ;;
        "swift") syntax="swift" ;;
        "kt") syntax="kotlin" ;;
        "r") syntax="r" ;;
        "dockerfile"|"Dockerfile") syntax="dockerfile" ;;
        *) syntax="$extension" ;;
    esac
    
    # Add path comment and code block
    echo "<!-- path: $file -->" >> output.md
    echo "\`\`\`$syntax" >> output.md
    cat "$file" >> output.md
    echo >> output.md
    echo "\`\`\`" >> output.md
    echo >> output.md
done