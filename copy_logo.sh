#!/bin/bash

# This script helps copy your logo from Downloads to the project

echo "This script will copy your logo from Downloads to the project."
echo "Please enter the exact filename of your logo (e.g., 'logo.png'):"
read LOGO_FILENAME

# Source path (Downloads folder)
SOURCE_PATH="$HOME/Downloads/$LOGO_FILENAME"

# Destination path (project public images folder)
DEST_PATH="public/images/logo.png"

if [ -f "$SOURCE_PATH" ]; then
    echo "Found $LOGO_FILENAME in Downloads folder."
    
    # Create directory if it doesn't exist
    mkdir -p public/images
    
    # Copy the file
    cp "$SOURCE_PATH" "$DEST_PATH"
    
    # Check if copy was successful
    if [ $? -eq 0 ]; then
        echo "Success! Logo has been copied to $DEST_PATH"
        echo "Your logo will now be used in the invoice PDF and can be used on the website."
    else
        echo "Error: Failed to copy the logo."
    fi
else
    echo "Error: Could not find $LOGO_FILENAME in your Downloads folder."
    echo "Please check the filename and try again."
fi 