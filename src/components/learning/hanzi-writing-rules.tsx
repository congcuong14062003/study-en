export function HanziWritingRules() {
  return (
    <aside className="hanzi-writing-rules" aria-label="Quy tắc viết chữ Hán">
      <h3>Quy tắc viết chữ Hán</h3>
      <ul>
        <li>
          <strong>Trên xuống dưới:</strong> <span lang="zh-CN">三</span> viết
          nét trên → giữa → dưới.
        </li>
        <li>
          <strong>Trái sang phải:</strong> <span lang="zh-CN">好</span> viết
          phần <span lang="zh-CN">女</span> trước, <span lang="zh-CN">子</span>{" "}
          sau.
        </li>
      </ul>
      <details>
        <summary>Xem thêm quy tắc và hướng đi của nét</summary>
        <ul>
          <li>
            <strong>Ngang trước, sổ sau:</strong> <span lang="zh-CN">十</span>{" "}
            viết ngang rồi dọc.
          </li>
          <li>
            <strong>Phẩy trước, mác sau:</strong> <span lang="zh-CN">人</span>{" "}
            viết nét xiên trái rồi xiên phải.
          </li>
          <li>
            <strong>Ngoài → trong → đóng khung:</strong>{" "}
            <span lang="zh-CN">国</span> viết khung ngoài, phần trong, cuối cùng
            nét đáy.
          </li>
          <li>
            <strong>Giữa trước, hai bên sau:</strong>{" "}
            <span lang="zh-CN">小</span> viết nét giữa rồi trái, phải.
          </li>
        </ul>
        <p>
          <strong>Hướng bút:</strong> ngang →, sổ ↓, phẩy ↙, mác ↘. Nét gập/móc
          viết liền; nhấc bút giữa hai nét.
        </p>
        <a
          href="https://stroke-order.learningweb.moe.edu.tw/page.jsp?ID=46&la=1"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tham khảo nguyên tắc bút thuận (MOE)
        </a>
      </details>
      <p className="hanzi-writing-rules-note">
        Đây là quy tắc chung, có ngoại lệ. Theo “Xem nét mẫu” hoặc “Gợi ý nét
        tiếp” của chữ đang luyện.
      </p>
    </aside>
  );
}
