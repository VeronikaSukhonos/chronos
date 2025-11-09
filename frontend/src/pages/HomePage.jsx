import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function HomePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function getItems() {
      try {
        const response = await axios.get(`${process.env.VITE_API_URL}/test/`);
        setItems(response.data.data);
        setMessage('');
      } catch(err) {
        setItems([]);
        setMessage(err?.response?.data?.error || 'Error getting items');
      }
    }
    getItems();
  }, []);

  async function createItem(e) {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.VITE_API_URL}/test`, { title });
        setItems([...items, response.data.data]);
        setMessage('');
      } catch(err) {
        setMessage(err?.response?.data?.error || 'Error during creating item');
      }
  }

  function updateItem(id) {
    return async (e) => {
      e.preventDefault();
      try {
        await axios.patch(`${process.env.VITE_API_URL}/test/${id}`, { title: `(updated)` });
        setItems(items.map(item => { return { ...item, title: item._id !== id ? item.title:`(updated)` } }));
        // const response = await axios.get(`${process.env.VITE_API_URL}/test/`);
        // setItems(response.data.data);
        setMessage('');
      } catch(err) {
        setMessage(err?.response?.data?.error || 'Error during deleting item');
      }
    }
  }

  function deleteItem(id) {
    return async (e) => {
      e.preventDefault();
      try {
        await axios.delete(`${process.env.VITE_API_URL}/test/${id}`);
        setItems(items.filter(item => item._id !== id));
        setMessage('');
      } catch(err) {
        setMessage(err?.response?.data?.error || 'Error during deleting item');
      }
    }
  }

  return (
    <>
      <form onSubmit={createItem}>
        <input
          type="text"
          placeholder="Title"
          id="title"
          required={true}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>
      {message && <p>{message}</p>}
      {items && items.map(item => (
        <form key={item._id.toString()}>
          <label onClick={() => navigate(`/${item._id.toString()}`)}>{item.title}</label>
          <button type="button" onClick={updateItem(item._id.toString())}>Update</button>
          <button type="button" onClick={deleteItem(item._id.toString())}>Delete</button>
        </form>
      ))}
    </>
  );
}

export default HomePage;
