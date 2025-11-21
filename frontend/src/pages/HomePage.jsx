import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectAuthUser } from '../store/authSlice.js';

function HomePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const auth = useSelector(selectAuthUser.user);

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

  if (!auth) return <Navigate to="login" />

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
      Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellat ipsam accusantium delectus ex natus nemo voluptatum at quisquam sunt earum minima explicabo reiciendis, ullam qui quasi autem dolores eius eligendi.
      Aliquam, voluptatibus saepe aliquid quas sunt maxime a ratione cum eius in eligendi iusto asperiores. Nihil quasi veritatis necessitatibus nobis, minus, voluptatibus quas nulla eaque voluptatum laboriosam excepturi autem. Officiis?
      Sit perspiciatis ad id sed. A facilis doloremque ad odio expedita error fuga, exercitationem sit neque cumque quos. Dicta veritatis, nulla adipisci inventore quia aliquam porro rem earum voluptas. Inventore!
      Totam odit sint quaerat ex ipsam consectetur adipisci sunt vel optio amet nesciunt commodi in aliquid ab temporibus, molestiae quisquam, esse, non veniam saepe doloribus culpa laboriosam nam similique. Quisquam.
      Accusantium laudantium atque, quasi sunt velit enim earum qui nostrum, suscipit laboriosam recusandae voluptatibus quaerat consectetur illum sed maiores libero impedit ullam harum quae doloribus deleniti nobis? Consequatur, dicta dolorem.
    </>
  );
}

export default HomePage;
