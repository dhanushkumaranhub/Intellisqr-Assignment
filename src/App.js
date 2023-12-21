import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const AuthContext = React.createContext();

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/get-lists`, { headers: { Authorization: token } })
        .then((response) => {
          setUser({ username: response.data[0]?.userId });
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
        });
    }
  }, [token]);

  const login = (token) => {
    setToken(token);
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Route path="/" render={() => <Redirect to="/login" />} />
        <Route path="/login" render={() => <LoginForm />} />
        <Route path="/register" render={() => <RegisterForm />} />
        <Route path="/todo" render={() => <TodoList />} />
      </AuthContext.Provider>
    </Router>
  );
};

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    axios.post(`${API_URL}/login`, { username, password })
      .then((response) => {
        login(response.data.token);
      })
      .catch((error) => {
        console.error('Login failed:', error);
      });
  };

  return (
    <div>
      <h1>Login</h1>
      <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

const RegisterForm = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    axios.post(`${API_URL}/register`, { username, password })
      .then((response) => {
        login(response.data.token);
      })
      .catch((error) => {
        console.error('Registration failed:', error);
      });
  };

  return (
    <div>
      <h1>Register</h1>
      <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
};

const TodoList = () => {
  const { user, logout } = useContext(AuthContext);
  const [lists, setLists] = useState([]);
  const [newList, setNewList] = useState({ title: '', date: '', description: '' });

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/get-lists`, { headers: { Authorization: token } })
        .then((response) => {
          setLists(response.data);
        })
        .catch((error) => {
          console.error('Error fetching lists:', error);
        });
    }
  }, [user]);

  const addList = () => {
    axios.post(`${API_URL}/add-list`, { ...newList, userId: user.username }, { headers: { Authorization: token } })
      .then((response) => {
        setLists([...lists, response.data]);
        setNewList({ title: '', date: '', description: '' });
      })
      .catch((error) => {
        console.error('Error adding list:', error);
      });
  };

  const editList = (id, newData) => {
    axios.put(`${API_URL}/edit-list/${id}`, newData, { headers: { Authorization: token } })
      .then((response) => {
        setLists(lists.map((list) => (list._id === id ? response.data : list)));
      })
      .catch((error) => {
        console.error('Error editing list:', error);
      });
  };

  const removeList = (id) => {
    axios.delete(`${API_URL}/remove-list/${id}`, { headers: { Authorization: token } })
      .then(() => {
        setLists(lists.filter((list) => list._id !== id));
      })
      .catch((error) => {
        console.error('Error removing list:', error);
      });
  };

  return (
    <div>
      <h1>Todo List</h1>
      <button onClick={logout}>Logout</button>
      <div>
        {lists.map((list) => (
          <div key={list._id}>
            <h3>{list.title}</h3>
            <p>{list.date}</p>
            <p>{list.description}</p>
            <input
              type="checkbox"
              checked={list.checked}
              onChange={(e) => editList(list._id, { checked: e.target.checked })}
            />
            <button onClick={() => removeList(list._id)}>Remove</button>
          </div>
        ))}
      </div>
      <div>
        <h2>Add a List</h2>
        <input
          type="text"
          placeholder="Title"
          value={newList.title}
          onChange={(e) => setNewList({ ...newList, title: e.target.value })}
        />
        <input
          type="date"
          placeholder="Date"
          value={newList.date}
          onChange={(e) => setNewList({ ...newList, date: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newList.description}
          onChange={(e) => setNewList({ ...newList, description: e.target.value })}
        />
        <button onClick={addList}>Add List</button>
      </div>
    </div>
  );
};

export default App;
