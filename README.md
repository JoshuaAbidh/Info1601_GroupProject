# PetSocial - Social Network for Pets

A modern social media platform dedicated to pets and their owners. Share photos, videos, and connect with other pet lovers in a pet-focused community.

## Features

- 🐾 Pet profile creation and management
- 📸 Photo and video uploads
- ❤️ Like and follow other pets
- 🎨 Pet-specific emotes for interaction
- 🔍 Trending pet hashtags
- 🔐 Secure authentication
- 📱 Responsive design

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: Instagram OAuth
- File Storage: AWS S3
- Styling: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Instagram Developer Account
- AWS Account (for file storage)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/petsocial.git
cd petsocial
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_uri
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
```

4. Start the development servers
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd frontend
npm start
```

## API Documentation

The application uses the Instagram Graph API for authentication and social features. For detailed API documentation, visit:
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-platform)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
