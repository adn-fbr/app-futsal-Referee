 import { AppRole } from "@/contexts/AuthContext";
 
 /**
  * Get the default route for a given role
  * @param role - The user's role
  * @param isAdmin - Whether the user has admin privileges
  * @returns The default route path for the role
  */
 export function getDefaultRouteByRole(
   role: AppRole | null,
   isAdmin: boolean
 ): string {
   if (isAdmin) {
     return "/dashboard";
   }
   
   switch (role) {
     case "wasit":
       return "/referee";
     case "evaluator":
       return "/evaluations";
     case "panitia":
       return "/events";
     case "admin_provinsi":
     case "admin_kab_kota":
       return "/dashboard";
     default:
       return "/";
   }
 }
 
 /**
  * Get the forbidden redirect route for a given role
  * Used when user tries to access a route they don't have permission for
  * @param role - The user's role
  * @param isAdmin - Whether the user has admin privileges
  * @returns The redirect path for forbidden access
  */
 export function getForbiddenRedirect(
   role: AppRole | null,
   isAdmin: boolean
 ): string {
   return getDefaultRouteByRole(role, isAdmin);
 }