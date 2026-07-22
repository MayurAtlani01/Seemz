import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

function Mainlayout() {
  return (
    <>
    <Navbar/>
    <Outlet/>
    <Footer/>
    </>
  )
}

export default Mainlayout