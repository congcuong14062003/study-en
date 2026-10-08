export function authRedirectErrorMessage(code: string | null): string {
  switch (code) {
    case null:
      return "";
    case "OAuthAccountNotLinked":
      return "Các phương thức đăng nhập là những tài khoản riêng, không thể gộp với phiên hiện tại. Hãy đăng xuất rồi chọn tài khoản Google hoặc Facebook bạn muốn dùng.";
    case "AccessDenied":
      return "Không thể đăng nhập với tài khoản này. Nếu bạn đã đăng ký bằng email nhưng chưa xác thực, hãy xác thực email trước.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Callback":
      return "Đăng nhập qua Google hoặc Facebook không thành công. Vui lòng thử lại sau.";
    case "Configuration":
      return "Đăng nhập qua Google hoặc Facebook đang gặp lỗi cấu hình. Vui lòng thử lại sau.";
    case "SessionRequired":
      return "Vui lòng đăng nhập để tiếp tục.";
    default:
      return "Không thể đăng nhập. Vui lòng thử lại hoặc dùng email và mật khẩu.";
  }
}
