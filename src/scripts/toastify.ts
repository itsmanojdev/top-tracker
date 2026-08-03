import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

const toastify = (message: string, type: "success" | "error" | "info") => {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        className: "max-w-[250px]!",
        style: {
            background: type === "success" ? "#00b09b" : type === "error" ? "#ff4444" : "#00b09b",
        },
        gravity: "top",
        position: "right",
        stopOnFocus: true,
    }).showToast();
};

export { toastify };
