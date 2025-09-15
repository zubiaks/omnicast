- /* =========================
-    Footer (BEM)
- ======================== */
- .site-footer { … }
+ /* =========================
+    Footer (BEM)
+ ======================== */
+ .oc-footer {
+   padding: var(--space-lg) 0;
+   border-top: 1px solid var(--color-border);
+   text-align: center;
+   background-color: var(--bg-elev);
+ }
+
+ .oc-footer .footer-nav {
+   margin-bottom: var(--space-sm);
+ }
+
+ .oc-footer .footer-links {
+   list-style: none;
+   margin: 0;
+   padding: 0;
+   display: inline-flex;
+   gap: var(--space-xs);
+ }
+
+ .oc-footer .footer-links li + li::before {
+   content: "•";
+   color: var(--color-muted);
+ }
+
+ .oc-footer .footer-links a {
+   color: var(--text);
+   text-decoration: none;
+   padding: var(--space-xxs) var(--space-xs);
+   border-radius: var(--round-sm);
+ }
+
+ .oc-footer .footer-links a:hover,
+ .oc-footer .footer-links a:focus {
+   background-color: var(--bg-alt);
+   outline: none;
+ }
+
+ .oc-footer .footer-copy {
+   font-size: 0.875rem;
+   color: var(--color-muted);
+   margin: 0;
+ }
