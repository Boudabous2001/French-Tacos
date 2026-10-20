CREATE TABLE "administrateurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nom" text NOT NULL,
	"mot_de_passe" text NOT NULL,
	"role" text DEFAULT 'gerant' NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"derniere_connexion" timestamp with time zone,
	CONSTRAINT "administrateurs_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"accroche" text,
	"image" text,
	"position" integer DEFAULT 0 NOT NULL,
	"actif" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commandes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" serial NOT NULL,
	"jeton" text NOT NULL,
	"statut" text NOT NULL,
	"mode" text NOT NULL,
	"client_prenom" text NOT NULL,
	"client_nom" text DEFAULT '' NOT NULL,
	"client_telephone" text NOT NULL,
	"client_email" text DEFAULT '' NOT NULL,
	"adresse" jsonb,
	"zone_id" text,
	"creneau" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL,
	"sous_total" integer NOT NULL,
	"frais_livraison" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"tva" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"paiement_mode" text NOT NULL,
	"paiement_statut" text NOT NULL,
	"stripe_payment_intent" text,
	"preparation_minutes" integer,
	"prete_prevue_a" timestamp with time zone,
	"motif_annulation" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL,
	"payee_le" timestamp with time zone,
	"acceptee_le" timestamp with time zone,
	"prete_le" timestamp with time zone,
	"terminee_le" timestamp with time zone,
	CONSTRAINT "commandes_numero_unique" UNIQUE("numero"),
	CONSTRAINT "commandes_jeton_unique" UNIQUE("jeton"),
	CONSTRAINT "commandes_stripe_payment_intent_unique" UNIQUE("stripe_payment_intent")
);
--> statement-breakpoint
CREATE TABLE "evenements_commande" (
	"id" serial PRIMARY KEY NOT NULL,
	"commande_id" uuid NOT NULL,
	"statut" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"auteur" text DEFAULT 'systeme' NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evenements_stripe" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"recu_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lignes_commande" (
	"id" serial PRIMARY KEY NOT NULL,
	"commande_id" uuid NOT NULL,
	"produit_id" text NOT NULL,
	"nom" text NOT NULL,
	"variante_nom" text,
	"resume" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prix_unitaire" integer NOT NULL,
	"quantite" integer NOT NULL,
	"total" integer NOT NULL,
	"tva" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listes_choix" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produits" (
	"id" text PRIMARY KEY NOT NULL,
	"categorie_id" text NOT NULL,
	"nom" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image" text,
	"prix" integer DEFAULT 0 NOT NULL,
	"variantes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"groupes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allergenes" jsonb,
	"badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tva" integer DEFAULT 1000 NOT NULL,
	"disponible" boolean DEFAULT true NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reglages" (
	"id" text PRIMARY KEY DEFAULT 'principal' NOT NULL,
	"donnees" jsonb NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions_admin" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" uuid NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"navigateur" text
);
--> statement-breakpoint
ALTER TABLE "evenements_commande" ADD CONSTRAINT "evenements_commande_commande_id_commandes_id_fk" FOREIGN KEY ("commande_id") REFERENCES "public"."commandes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_commande_id_commandes_id_fk" FOREIGN KEY ("commande_id") REFERENCES "public"."commandes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produits" ADD CONSTRAINT "produits_categorie_id_categories_id_fk" FOREIGN KEY ("categorie_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sessions_admin" ADD CONSTRAINT "sessions_admin_admin_id_administrateurs_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."administrateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commandes_statut_idx" ON "commandes" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "commandes_cree_le_idx" ON "commandes" USING btree ("cree_le");--> statement-breakpoint
CREATE INDEX "evenements_commande_idx" ON "evenements_commande" USING btree ("commande_id");--> statement-breakpoint
CREATE INDEX "lignes_commande_idx" ON "lignes_commande" USING btree ("commande_id");--> statement-breakpoint
CREATE INDEX "produits_categorie_idx" ON "produits" USING btree ("categorie_id");--> statement-breakpoint
CREATE INDEX "sessions_admin_expire_idx" ON "sessions_admin" USING btree ("expire_le");--> statement-breakpoint
-- Numéros de commande lisibles à partir de 1001
ALTER SEQUENCE "commandes_numero_seq" RESTART WITH 1001;
