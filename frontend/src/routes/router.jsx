import { createBrowserRouter } from "react-router-dom";

import Mainlayout from "../layouts/Mainlayout";


import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import About from "../pages/About/About";
import Products from "../pages/Products/Products";
import ProductDetails from "../pages/ProductDetails/ProductDetails";
import Cart from "../pages/Cart/Cart";
import Wishlist from "../pages/Wishlist/Wishlist";
import Orders from "../pages/Orders/Orders";
import Profile from "../pages/Profile/Profile";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import ResetPassword from "../pages/ResetPassword/ResetPassword";
import Men from "../pages/Men/Men";
import Women from "../pages/Women/Women";
import NewArrivals from "../pages/NewArrivals/NewArrivals";


const router = createBrowserRouter([
  {path:"/Login",
    element: <Login/>
  },
  {path:"/register",
    element: <Register/>
  },
  {path:"/forgot-password",
    element: <ForgotPassword/>
  },
    {path:"/reset-password",
    element: <ResetPassword/>
  },
  {
    path: "/",
    element: <Mainlayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
       {
        path: "men",
        element: <Men />,
      },
       {
        path: "women",
        element: <Women />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "products/:id",
        element: <ProductDetails />,
      },
      {
        path: "cart",
        element: <Cart />,
      },
      {
        path: "wishlist",
        element: <Wishlist />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
       {
        path: "new",
        element: <NewArrivals />,
      },
    ],
  },
]);

export default router;