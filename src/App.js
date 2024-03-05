import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import "./App.css";
import image from "./img/gold.png";

function App() {
  const password = "Valantis";
  const timestamp = new Date().toISOString().slice(0, 10).split("-").join("");
  const auth = `${password}_${timestamp}`;
  const authString = CryptoJS.MD5(auth).toString();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [start, setStart] = useState(0);
  const [offset, setOffset] = useState(0);
  const [formData, setFormData] = useState({
    product: "",
    price: null,
    brand: "",
  });
  const [submittedForm, setSubmittedForm] = useState({
    product: "",
    price: null,
    brand: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedForm(formData);
    setOffset(0);
    setStart(0);
  };

  const prevHandler = () => {
    setOffset(offset - 50);
    setStart(start - 50);
  };
  const nextHandler = () => {
    setOffset(offset + 50);
    setStart(start + 50);
  };

  const url = "https://api.valantis.store:41000/";
  const headers = {
    "Content-Type": "application/json",
    "X-Auth": authString,
  };

  const removeDuplicates = (ids) => {
    return ids.filter((number, index, numbers) => {
      return numbers.indexOf(number) === index;
    });
  };
  const removeItemDuplicates = (ids) => {
    return ids.filter(
      (value, index, self) => index === self.findIndex((t) => t.id === value.id)
    );
  };

  let filteredProducts = [];
  let filteredPrices = [];
  let filteredBrands = [];
  let filteredArray = [];
  let filteredIds = [];
  let currentIds = [];

  const fetchProducts = async () => {
    await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        action: "filter",
        params: { product: submittedForm.product },
      }),
    })
      .then((res) => res.json())
      .then((json) => json.result)
      .then((ids) => removeDuplicates(ids))
      .then((products) => {
        filteredProducts = products;
        filteredArray = [...filteredArray, ...products];
      });
  };

  const fetchPrices = async () => {
    await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        action: "filter",
        params: { price: +submittedForm.price },
      }),
    })
      .then((res) => res.json())
      .then((json) => json.result)
      .then((ids) => removeDuplicates(ids))
      .then((prices) => {
        filteredPrices = prices;
        filteredArray = [...filteredArray, ...prices];
      });
  };
  const fetchBrands = async () => {
    await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        action: "filter",
        params: { brand: submittedForm.brand },
      }),
    })
      .then((res) => res.json())
      .then((json) => json.result)
      .then((ids) => removeDuplicates(ids))
      .then((brands) => {
        filteredBrands = brands;
        filteredArray = [...filteredArray, ...brands];
      });
  };

  const filterFetch = async () => {
    submittedForm.product &&
      (await fetchProducts().catch((error) => {
        console.error(error);
        fetchProducts();
      }));

    submittedForm.price &&
      (await fetchPrices().catch((error) => {
        console.error(error);
        fetchPrices();
      }));
    submittedForm.brand &&
      (await fetchBrands().catch((error) => {
        console.error(error);
        fetchBrands();
      }));
    if (
      (!submittedForm.product && !submittedForm.price && submittedForm.brand) ||
      (!submittedForm.product && !submittedForm.brand && submittedForm.price) ||
      (!submittedForm.brand && !submittedForm.price && submittedForm.product)
    ) {
      filteredIds = filteredArray;
    } else if (
      (submittedForm.product && submittedForm.price && !submittedForm.brand) ||
      (submittedForm.product && submittedForm.brand && !submittedForm.price) ||
      (submittedForm.brand && submittedForm.price && !submittedForm.product)
    ) {
      filteredIds = filteredArray.filter((id, index, ids) => {
        return ids.indexOf(id) !== index;
      });
    } else if (
      submittedForm.product &&
      submittedForm.price &&
      submittedForm.brand
    ) {
      let filteredProductsAndPrices = [
        ...filteredProducts,
        ...filteredPrices,
      ].filter((id, index, ids) => {
        return ids.indexOf(id) !== index;
      });
      filteredIds = [...filteredProductsAndPrices, ...filteredBrands].filter(
        (id, index, ids) => {
          return ids.indexOf(id) !== index;
        }
      );
    }

    if (filteredIds.length > 50) {
      currentIds = filteredIds.slice(start, start + 50);
    } else {
      currentIds = filteredIds;
    }
    filteredIds = [];
    return Promise.resolve(currentIds);
  };

  const fetchItems = async (idsArray) => {
    await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        action: "get_items",
        params: { ids: idsArray },
      }),
    })
      .then((res) => res.json())
      .then((ids) => removeItemDuplicates(ids.result))
      .then((items) => {
        setData(items);
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      (submittedForm.product || submittedForm.price || submittedForm.brand
        ? filterFetch()
        : fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              action: "get_ids",
              params: { offset: offset, limit: 50 },
            }),
          })
            .then((res) => res.json())
            .then((json) => json.result)
            .then((ids) => removeDuplicates(ids))
      ).then((idsArray) => {
        return fetchItems(idsArray).catch((error) => {
          console.error(error);
          fetchItems();
        });
      });
    };
    fetchData().catch((error) => {
      console.error(error);
      fetchData();
    });
  }, [submittedForm, offset]);

  return (
    <div className="App">
      <h1>Ювелирные изделия</h1>
      <form className="filter" onSubmit={handleSubmit}>
        <label>
          Название:&nbsp;
          <input type="text" name="product" onChange={handleChange} />
        </label>
        <label>
          Цена:&nbsp;
          <input type="text" name="price" onChange={handleChange} />
        </label>
        <label>
          Бренд:&nbsp;
          <input type="text" name="brand" onChange={handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
      <div className="items">
        {loading ? (
          <div className="loader"></div>
        ) : (
          data?.map((item, index) => (
            <div className="item" key={index}>
              <img src={image} alt="img"></img>
              <div>
                <span>Id:</span>
                {item.id}
              </div>
              <div>
                <span>Name:</span>
                {item.product}
              </div>
              <div>
                <span>Price:</span>
                {item.price}
              </div>
              <div>
                <span>Brand:</span>
                {item.brand}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="buttons">
        <button onClick={prevHandler}>prev</button>
        <button onClick={nextHandler}>next</button>
      </div>
    </div>
  );
}

export default App;
