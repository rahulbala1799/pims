# Logo Storage in PrintMIS

## Development vs. Production Environment

This application handles logo storage differently based on the environment:

### Local Development
- In local development, logos are stored in the filesystem at `public/images/logo.png`
- This works well for local testing as the filesystem is persistent

### Production (Railway/Vercel)
- In production, the filesystem is ephemeral (temporary) - files don't persist between deployments or app restarts
- For proper production use, the app is configured to use cloud storage (AWS S3)
- Currently this is set up as a mock implementation since real AWS credentials are needed

## Setting Up Real Cloud Storage

To properly store logos in production:

1. Create an AWS account and S3 bucket
2. Add the following environment variables to your Railway/Vercel project:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_REGION`: The region where your S3 bucket is located (default: us-east-1)
   - `AWS_BUCKET_NAME`: Your S3 bucket name (default: printpack-logos)

3. Update the image URLs in the components to point to your S3 bucket:
   ```javascript
   // Example for S3
   const logoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/logo.png`;
   ```

## Current Placeholders

For demonstration purposes:
- The app will show a success message when uploading a logo in production
- A placeholder logo will be displayed
- In a real production environment, logos would be served from S3 