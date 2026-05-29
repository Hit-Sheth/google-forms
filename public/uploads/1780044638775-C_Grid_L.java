
import java.util.Scanner;

public class C_Grid_L{
    private static final double EPS = 1e-9;

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int t = sc.nextInt();
        while(t-->0){

            double a = sc.nextDouble();
            double b = sc.nextDouble();
            double D = a + 2*b;
            double x = a/4 + b/2;
            double p= 2*x -D;
            if(p*p-4*x<0) {
                System.out.println(-1);
                continue;
            }
            double q = Math.sqrt(p*p-4*x);
            double c = (-1*p + q)/2;
            if(c<=0) {
                System.out.println(-1);
                continue;
            }

            int ans1 = (int) Math.round(c);
            if (Math.abs(c - ans1) > EPS) {
                System.out.println(-1);
                continue;
            }

            double second = x / ans1;
            int ans2 = (int) Math.round(second);
            if (ans2 <= 0 || Math.abs(second - ans2) > EPS) {
                System.out.println(-1);
                continue;
            }

            System.out.println(ans1+" "+ans2);

        }
        sc.close();
    }
}