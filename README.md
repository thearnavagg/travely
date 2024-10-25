# Travely (Agent for Planning Trip)

Welcome to Travely! This full-stack web application combines **Django** for the backend and **Vite** for the frontend, providing a seamless experience for users to explore travel options. This guide will help you set up the project on your local machine.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Backend Setup (Django)](#backend-setup-django)
- [Frontend Setup (Vite)](#frontend-setup-vite)
- [Running the Application](#running-the-application)
- [License](#license)

## Prerequisites
Before you begin, ensure you have the following installed on your system:
- **Python** (>= 3.8)
- **Node.js** (>= 14.x)
- **npm** or **Yarn**
- **SQLite**
- **Git** (optional, for version control)

## Backend Setup (Django)
Follow these steps to set up the backend:
1. **Clone the Repository**:
    ```bash
    git clone https://github.com/Boot41/travely-arnav-aggarwal.git
    cd travely-arnav-aggarwal
    ```
2. **Create a Virtual Environment**:
    Navigate to the server directory:
    ```bash
    cd server
    ```
    For Linux/macOS:
    ```bash
    python3 -m venv env
    source env/bin/activate
    ```
    For Windows:
    ```bash
    python -m venv env
    .\env\Scripts\activate
    ```
3. **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4. **Set Up**:
    - Update your `settings.py` with your database configurations or create a `.env` file with the necessary environment variables. Your `.env` file should include:
        ```
        OPENAI_API_KEY=your_openai_api_key
        ```
    - Run Migrations:
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```
    - (Optional) Populate the Database with Mock Data:
    ```bash
    python manage.py loaddata mock_data
    ```
5. **Start the Django Development Server**:
    ```bash
    python manage.py runserver
    ```

## Frontend Setup (Vite)
Next, set up the frontend:
1. **Navigate to the Frontend Directory**:
    ```bash
    cd client
    ```
2. **Install Node Dependencies**:
    Using npm:
    ```bash
    npm install
    ```
3. **Configure Frontend Environment**:
    Create a `.env` file in the `client` directory for environment-specific variables, such as the API URL. Your `.env` file should include:
    ```
    VITE_MAPPLS_API_KEY=your_mappls_api_key
    VITE_API_URL=your_api_url
    ```
4. **Start the Vite Development Server**:
    Using npm:
    ```bash
    npm run dev
    ```

## Running the Application
After completing the setup, you can access the application by navigating to `http://localhost:8000` for the Django backend and `http://localhost:5173` for the Vite frontend in your browser.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
