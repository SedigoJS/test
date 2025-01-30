import React from 'react'
import Home from './home/page'
import Footer from './footer/page'
import Product from './product/page'

const page = () => {
  return (
    <div className='font-gigasan'>
      <Home />
      <Product />
      <Footer />
    </div>
  )
}

export default page