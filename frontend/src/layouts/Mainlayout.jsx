import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

function Mainlayout() {
  return (
    <>
    <ScrollToTop/>
    <Navbar/>
    <Outlet/>
    <Footer/>
    </>
  )
}

export default Mainlayout