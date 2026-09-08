import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/security";
export async function requireCourseAccess(userId: string, courseId: string, client: Prisma.TransactionClient = db) {
    const [course, user, enrolled] = await Promise.all([
        client.course.findUnique({ where: { id: courseId } }),
        client.user.findUnique({ where: { id: userId }, include: { subscription: true } }),
        client.courseEnrollment.findUnique({ where: { userId_courseId: { userId, courseId } } })
    ]);
    if (!course?.published)
        throw new ApiError("Khóa học chưa được xuất bản.", 404);
    if (!user || user.banned)
        throw new ApiError("Tài khoản không khả dụng.", 401);
    if (!enrolled)
        throw new ApiError("Hãy đăng ký khóa học trước khi bắt đầu.", 403);
    const sub = user.subscription;
    if (course.premium && user.role !== "ADMIN" && !(sub?.plan === "PREMIUM" && sub.status === "active" && (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date())))
        throw new ApiError("Khóa học yêu cầu gói Premium còn hiệu lực.", 403);
    return course;
}
