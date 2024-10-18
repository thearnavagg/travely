# FSE Application (built using Dev41)

This is a full-stack web application built using **Django** for the backend and **React** for the frontend. This guide will walk you through the setup and key steps required to run the project locally.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Backend Setup (Django)](#backend-setup-django)
- [Frontend Setup (React)](#frontend-setup-react)

## Prerequisites

Ensure you have the following installed on your system:

- Python (>= 3.8)
- Node.js (>= 14.x)
- npm or Yarn
- PostgreSQL or SQLite (if using a database)
- Git (optional, for version control)

## Backend Setup (Django)

1. **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2. **Create a virtual environment**:

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

3. **Install Django and other backend dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

4. **Set up the database** (PostgreSQL/SQLite):

    Update your `settings.py` with your database configurations, or set up `.env` with the necessary environment variables.
     First, navigate to the backend folder:
    ```bash
    cd server
    ```
     Run the migrations:
    ```bash
    python manage.py makemigrations
    ```
    Then run the migrations:
    ```bash
    python manage.py migrate
    ```
    Optional: Populate the DB with mockdata:
    ```bash
    python manage.py loaddata mock_data
    ```

5. **Start the Django development server**:

    ```bash
    python manage.py runserver
    ```

## Frontend Setup (React)

1. **Navigate to the frontend directory**:

    ```bash
    cd client
    ```

2. **Install Node dependencies**:

    Using npm:
    ```bash
    npm install
    ```


3. **Optional: Configure frontend environment**:

    Set up a `.env` file in the `frontend` directory (for environment-specific variables like API URL).

4. **Start the React development server**:

    Using npm:
    ```bash
    npm run dev
    ```

    


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

