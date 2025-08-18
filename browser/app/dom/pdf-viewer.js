

class PdfViewer {
    constructor(filePath) {
        this.filePath = filePath.replace('file://', '').replace('jpg', 'pdf');
        console.log('PdfViewer initialized with filePath:', this.filePath);
    }

    open() {
        // Open a new window
        const newWindow = window.open('', '_blank', 'width=800,height=600');

        // Create the HTML content for the new window
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PDF Viewer</title>
                <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: hidden;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <iframe src="../${this.filePath}" type="application/pdf"></iframe>
            </body>
            </html>
        `;

        // Write the HTML content to the new window
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    }
}