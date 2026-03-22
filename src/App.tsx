import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";
import { CartPage } from "./pages/CartPage";
import { OrderPage } from "./pages/OrderPage";
import { ProgressPage } from "./pages/ProgressPage";
import { PrepPage } from "./pages/PrepPage";
import { ManagePage } from "./pages/ManagePage";

export default function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<MenuPage />} path="/menu" />
      <Route element={<CartPage />} path="/cart" />
      <Route element={<OrderPage />} path="/orders/:date" />
      <Route element={<ProgressPage />} path="/progress/:date" />
      <Route element={<PrepPage />} path="/prep" />
      <Route element={<ManagePage />} path="/manage" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
