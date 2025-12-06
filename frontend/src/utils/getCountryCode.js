import axios from 'axios';

export const getCountryCode = async () => {
  try {
    const countryResponse = await axios.get(`https://api.ipinfo.io/lite/me?token=${import.meta.env.VITE_IP_API_KEY}`);
    return countryResponse.data.country_code;
  } catch {
    return '';
  }
};
