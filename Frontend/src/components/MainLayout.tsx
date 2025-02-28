import React from 'react'
import Header from './Header'
import Footer from './Footer'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className='min-h-screen'>
    <Header />
    <Outlet />
    <Footer/>
    </div>
  )
}
