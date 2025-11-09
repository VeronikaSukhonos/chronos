import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function ItemPage() {
  const navigate = useNavigate();
  const { test_id } = useParams();
  const [item, setItem] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function getItem() {
      try {
        const response = await axios.get(`${process.env.VITE_API_URL}/test/${test_id}`);
        setItem(response.data.data);
        setMessage('');
      } catch(err) {
        setItem({});
        setMessage(err?.response?.data?.error || 'Error getting item');
      }
    }
    getItem();
  }, [test_id]);

  return (
    <>
      <p>
        {JSON.stringify(item)}
      </p>
      {message && <p>{message}</p>}
      <button type="button" onClick={() => navigate(`/`)}>To main page</button>
    </>
  );
}

export default ItemPage;

