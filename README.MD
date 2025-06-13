# Movies

## How to run

### Clone the repository

```bash
git clone https://github.com/sl0wdive/movies
cd movies
```

### Create `.env`

Create a `.env` file in the project root and configure all required environment variables. Example:

```bash
APP_PORT = 8050
DB_USER = user
DB_PASS = 123456
JWT_SECRET = your_jwt_secret
```

### Run localy

**Development mode:**
```bash
npm install
npm run dev
```

**Production mode:**
```bash
npm install
npm run build
npm run start
```

## Docker

### Build the docker image

```bash
docker build -t your_super_account/movies .
```

### Run with Docker

```bash
docker run --name movies -p 8000:8050 -e APP_PORT=8050 -e DB_USER=user -e DB_PASS=your_pass -e JWT_SECRET=your_jwt_secret your_super_account/movies
```

## Accessing the Application

Once the application is running:

- **Local eviroment:**

  Visit [http://localhost:8050](http://localhost:8050)

- **Docker container:** 

  Visit [http://localhost:8000](http://localhost:8000)

You will see a simple form to create a user or start a session. After creating either one, you will have the option to upload your movies.ts file.


## Docker image

DockerHub Image: [sl0wdive/movies](https://hub.docker.com/r/sl0wdive/movies)
