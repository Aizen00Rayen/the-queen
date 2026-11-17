import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { Preloader } from './components/Brand';
import { SmoothScroll, Cursor, ScrollProgress } from './components/Experience';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Checkout from './pages/Checkout';
import { ThankYou, Track, Story, Faq, Contact } from './pages/Pages';
import NotFound from './pages/NotFound';

const Admin = lazy(() => import('./admin/Admin'));

export default function App() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#F7F4EF]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div>}>
        <Routes><Route path="/admin/*" element={<Admin />} /></Routes>
      </Suspense>
    );
  }
  return (
    <>
      <Preloader />
      <SmoothScroll />
      <ScrollProgress />
      <Cursor />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="boutique" element={<Shop />} />
          <Route path="produit/:slug" element={<Product />} />
          <Route path="commande" element={<Checkout />} />
          <Route path="merci/:number" element={<ThankYou />} />
          <Route path="suivi" element={<Track />} />
          <Route path="maison" element={<Story />} />
          <Route path="faq" element={<Faq />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
