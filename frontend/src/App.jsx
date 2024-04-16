import { Container } from "react-bootstrap";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <>
      <div className="d-flex flex-column justify-content-between">
        <div>
          <Header />
          <main className="py-3">
            <Container>
              <Outlet />
            </Container>
          </main>
        </div>
        <Footer />
        <ToastContainer />
      </div>
    </>
  );
};

export default App;
