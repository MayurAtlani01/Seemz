import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
import ChatAssistant from '../components/ChatAssistant/ChatAssistant';

function Mainlayout() {
  return (
    <>
    <ScrollToTop/>
    <Navbar/>
    <Outlet/>
    <Footer/>
    <ChatAssistant/>
    </>
  )
}

export default Mainlayout