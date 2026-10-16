 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
 import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 interface ReportData {
   title: string;
   subtitle?: string;
   dateRange: string;
   filters?: Record<string, string>;
   summaryCards?: Array<{ label: string; value: string | number }>;
   tableData?: Array<Record<string, any>>;
   tableColumns?: Array<{ key: string; label: string }>;
 }
 
 serve(async (req) => {
   // Handle CORS preflight requests
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Get authorization header
     const authHeader = req.headers.get("authorization");
     if (!authHeader) {
       throw new Error("No authorization header");
     }
 
     // Create Supabase client
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_ANON_KEY") ?? "",
       {
         global: {
           headers: { Authorization: authHeader },
         },
       }
     );

     const supabaseAdmin = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
     );
     const caller = await resolveCaller(req, supabaseAdmin);
     if (!caller || !hasAnyRole(caller, ["admin_provinsi", "admin_kab_kota", "evaluator"])) {
       throw new Error("Forbidden");
     }
 
     // Verify user is authenticated
     const {
       data: { user },
       error: authError,
     } = await supabase.auth.getUser();
 
     if (authError || !user) {
       throw new Error("Unauthorized");
     }
 
     // Parse request body
     const reportData: ReportData = await req.json();
 
     console.log("Generating PDF report:", reportData.title);
 
     // Create a new PDF document
     const pdfDoc = await PDFDocument.create();
     
     // Embed fonts
     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
     const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
     
     // Add a page
     let page = pdfDoc.addPage([595, 842]); // A4 size
     const { width, height } = page.getSize();
     const margin = 50;
     let yPosition = height - margin;
 
     // Helper function to add new page if needed
     const checkAndAddPage = (requiredSpace: number) => {
       if (yPosition - requiredSpace < margin) {
         page = pdfDoc.addPage([595, 842]);
         yPosition = height - margin;
         return true;
       }
       return false;
     };
 
     // Draw header
     page.drawText("FFSS", {
       x: width - margin - 40,
       y: yPosition,
       size: 14,
       font: boldFont,
       color: rgb(0.23, 0.51, 0.96), // blue-500
     });
     
     page.drawText("Federasi Futsal Sulawesi Selatan", {
       x: width - margin - 150,
       y: yPosition - 15,
       size: 8,
       font: regularFont,
       color: rgb(0.4, 0.45, 0.55),
     });
 
     // Draw title
     page.drawText(reportData.title, {
       x: margin,
       y: yPosition - 5,
       size: 20,
       font: boldFont,
       color: rgb(0.12, 0.16, 0.23), // slate-800
     });
     yPosition -= 35;
 
     // Draw subtitle
     if (reportData.subtitle) {
       page.drawText(reportData.subtitle, {
         x: margin,
         y: yPosition,
         size: 11,
         font: regularFont,
         color: rgb(0.39, 0.45, 0.55), // slate-500
       });
       yPosition -= 20;
     }
 
     // Draw date range
     page.drawText(`Periode: ${reportData.dateRange}`, {
       x: margin,
       y: yPosition,
       size: 10,
       font: regularFont,
       color: rgb(0.28, 0.33, 0.41), // slate-600
     });
     yPosition -= 15;
 
     // Draw filters
     if (reportData.filters && Object.keys(reportData.filters).length > 0) {
       const filterText = Object.entries(reportData.filters)
         .filter(([_, value]) => value)
         .map(([key, value]) => `${key}: ${value}`)
         .join(" | ");
       
       if (filterText) {
         page.drawText(`Filter: ${filterText}`, {
           x: margin,
           y: yPosition,
           size: 10,
           font: regularFont,
           color: rgb(0.28, 0.33, 0.41),
         });
         yPosition -= 15;
       }
     }
 
     // Draw generation date
     const genDate = new Date().toLocaleString("id-ID", { 
       timeZone: "Asia/Makassar" 
     });
     page.drawText(`Dibuat: ${genDate}`, {
       x: margin,
       y: yPosition,
       size: 9,
       font: regularFont,
       color: rgb(0.28, 0.33, 0.41),
     });
     yPosition -= 25;
 
     // Draw horizontal line
     page.drawLine({
       start: { x: margin, y: yPosition },
       end: { x: width - margin, y: yPosition },
       thickness: 1,
       color: rgb(0.89, 0.91, 0.94), // slate-200
     });
     yPosition -= 25;
 
     // Draw summary cards
     if (reportData.summaryCards && reportData.summaryCards.length > 0) {
       checkAndAddPage(100);
       
       page.drawText("Ringkasan", {
         x: margin,
         y: yPosition,
         size: 12,
         font: boldFont,
         color: rgb(0.12, 0.16, 0.23),
       });
       yPosition -= 20;
 
       const cardWidth = (width - 2 * margin - 30) / 4;
       const cardHeight = 50;
       
       for (let i = 0; i < reportData.summaryCards.length; i++) {
         const card = reportData.summaryCards[i];
         const col = i % 4;
         const row = Math.floor(i / 4);
         const xPos = margin + col * (cardWidth + 10);
         const yPos = yPosition - row * (cardHeight + 10);
 
         // Draw card background
         page.drawRectangle({
           x: xPos,
           y: yPos - cardHeight,
           width: cardWidth,
           height: cardHeight,
           color: rgb(0.97, 0.98, 0.99), // slate-50
           borderColor: rgb(0.89, 0.91, 0.94),
           borderWidth: 1,
         });
 
         // Draw card label
         page.drawText(card.label, {
           x: xPos + 8,
           y: yPos - 20,
           size: 8,
           font: regularFont,
           color: rgb(0.39, 0.45, 0.55),
         });
 
         // Draw card value
         const valueStr = String(card.value);
         const valueFontSize = valueStr.length > 15 ? 11 : 14;
         page.drawText(valueStr, {
           x: xPos + 8,
           y: yPos - 38,
           size: valueFontSize,
           font: boldFont,
           color: rgb(0.12, 0.16, 0.23),
         });
       }
 
       yPosition -= Math.ceil(reportData.summaryCards.length / 4) * (cardHeight + 10) + 20;
     }
 
     // Draw table
     if (reportData.tableData && reportData.tableData.length > 0 && reportData.tableColumns) {
       checkAndAddPage(150);
 
       page.drawText("Data Detail", {
         x: margin,
         y: yPosition,
         size: 12,
         font: boldFont,
         color: rgb(0.12, 0.16, 0.23),
       });
       yPosition -= 20;
 
       // Calculate column widths
       const tableWidth = width - 2 * margin;
       const colWidth = tableWidth / reportData.tableColumns.length;
       const rowHeight = 20;
 
       // Draw table header
       page.drawRectangle({
         x: margin,
         y: yPosition - rowHeight,
         width: tableWidth,
         height: rowHeight,
         color: rgb(0.23, 0.51, 0.96), // blue-500
       });
 
       reportData.tableColumns.forEach((col, idx) => {
         const text = col.label.length > 15 ? col.label.substring(0, 13) + "..." : col.label;
         page.drawText(text, {
           x: margin + idx * colWidth + 5,
           y: yPosition - 14,
           size: 9,
           font: boldFont,
           color: rgb(1, 1, 1), // white
         });
       });
       yPosition -= rowHeight;
 
       // Draw table rows (limit to 30 rows per page)
       const maxRowsPerPage = 30;
       const rowsToDisplay = reportData.tableData.slice(0, maxRowsPerPage);
       
       rowsToDisplay.forEach((row, rowIdx) => {
         if (checkAndAddPage(rowHeight + 50)) {
           // Redraw header on new page
           page.drawRectangle({
             x: margin,
             y: yPosition - rowHeight,
             width: tableWidth,
             height: rowHeight,
             color: rgb(0.23, 0.51, 0.96),
           });
           
           reportData.tableColumns!.forEach((col, idx) => {
             const text = col.label.length > 15 ? col.label.substring(0, 13) + "..." : col.label;
             page.drawText(text, {
               x: margin + idx * colWidth + 5,
               y: yPosition - 14,
               size: 9,
               font: boldFont,
               color: rgb(1, 1, 1),
             });
           });
           yPosition -= rowHeight;
         }
 
         // Alternate row colors
         if (rowIdx % 2 === 1) {
           page.drawRectangle({
             x: margin,
             y: yPosition - rowHeight,
             width: tableWidth,
             height: rowHeight,
             color: rgb(0.97, 0.98, 0.99), // slate-50
           });
         }
 
         reportData.tableColumns!.forEach((col, colIdx) => {
           const value = row[col.key];
           let text = value == null ? "-" : String(value);
           
           // Truncate long text
           if (text.length > 20) {
             text = text.substring(0, 18) + "...";
           }
 
           page.drawText(text, {
             x: margin + colIdx * colWidth + 5,
             y: yPosition - 14,
             size: 8,
             font: regularFont,
             color: rgb(0.2, 0.25, 0.33), // slate-700
           });
         });
 
         yPosition -= rowHeight;
       });
 
       if (reportData.tableData.length > maxRowsPerPage) {
         yPosition -= 20;
         page.drawText(
           `Menampilkan ${maxRowsPerPage} dari ${reportData.tableData.length} baris. Gunakan export CSV untuk data lengkap.`,
           {
             x: margin,
             y: yPosition,
             size: 8,
             font: regularFont,
             color: rgb(0.58, 0.64, 0.72), // slate-400
           }
         );
       }
     }
 
     // Add footer to all pages
     const pages = pdfDoc.getPages();
     pages.forEach((pg, idx) => {
       pg.drawText(`Halaman ${idx + 1} dari ${pages.length}`, {
         x: width / 2 - 40,
         y: 30,
         size: 8,
         font: regularFont,
         color: rgb(0.58, 0.64, 0.72),
       });
       
       pg.drawText("Federasi Futsal Sulawesi Selatan", {
         x: margin,
         y: 30,
         size: 8,
         font: regularFont,
         color: rgb(0.58, 0.64, 0.72),
       });
     });
 
     // Save the PDF
     const pdfBytes = await pdfDoc.save();
 
     console.log("PDF generated successfully, size:", pdfBytes.length, "bytes");
 
     // Return the PDF
     return new Response(pdfBytes as unknown as BodyInit, {
       headers: {
         ...corsHeaders,
         "Content-Type": "application/pdf",
         "Content-Disposition": `attachment; filename="laporan-${Date.now()}.pdf"`,
       },
     });
   } catch (error) {
     console.error("Error generating PDF:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
       JSON.stringify({ error: errorMessage }),
       {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });