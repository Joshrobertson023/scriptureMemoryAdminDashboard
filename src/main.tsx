import { createRoot } from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes} from "react-router";
import Login from "./Routes/Login";
import MainLayout from "./Layouts/MainLayout";
import Syncer from "./Routes/Syncer";
import 'bootstrap/dist/js/bootstrap.bundle.min';
import Logout from "./Routes/Logout";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route element={<MainLayout />} >
              <Route path="/" element={<Syncer />} />
          </Route>
      </Routes>
  </BrowserRouter>
)
