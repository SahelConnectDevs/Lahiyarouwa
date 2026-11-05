# Site vitrine — lahiyarouwadayaro.com

Site statique (HTML/CSS/JS, sans framework ni étape de build) qui présente l'application et héberge les pages exigées par la Google Play Console.

| Page | URL publique | Usage Play Console |
| --- | --- | --- |
| `index.html` | https://lahiyarouwadayaro.com/ | Site web de l'application (fiche Play Store) |
| `confidentialite.html` | https://lahiyarouwadayaro.com/confidentialite | **Règles de confidentialité** (Contenu de l'appli → Règles de confidentialité) |
| `suppression-compte.html` | https://lahiyarouwadayaro.com/suppression-compte | **URL de suppression du compte** (Sécurité des données → Suppression des données) |

Le site n'utilise **aucun service tiers** : ni police Google, ni CDN, ni outil de mesure d'audience. Il reste ainsi cohérent avec la politique de confidentialité, et la Content-Security-Policy de nginx (`deploy/security-headers.conf`) le garantit.

## Prévisualiser en local

```bash
cd website
python -m http.server 8000
# puis ouvrir http://localhost:8000/index.html
```

En local, les URLs propres (`/confidentialite`) ne marchent pas : utilisez `/confidentialite.html`. nginx les gère en production.

## Mise en ligne sur le VPS (une seule fois)

Prérequis : un VPS Ubuntu/Debian avec un accès SSH et `sudo`.

1. **DNS** : chez le registrar du domaine, créez deux enregistrements `A` (plus `AAAA` si le VPS a une IPv6) :
   - `lahiyarouwadayaro.com` → IP du VPS
   - `www.lahiyarouwadayaro.com` → IP du VPS

2. **Serveur** :

   ```bash
   sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
   sudo mkdir -p /var/www/lahiyarouwadayaro.com/releases
   sudo chown -R $USER:$USER /var/www/lahiyarouwadayaro.com
   sudo ufw allow 'Nginx Full'   # si le pare-feu ufw est actif
   ```

3. **Configuration nginx**, à copier depuis votre poste :

   ```bash
   scp website/deploy/nginx.conf             user@IP:/tmp/lahiyarouwa.conf
   scp website/deploy/security-headers.conf  user@IP:/tmp/lahiyarouwa-security-headers.conf
   ```

   puis sur le VPS :

   ```bash
   sudo mv /tmp/lahiyarouwa-security-headers.conf /etc/nginx/snippets/
   sudo mv /tmp/lahiyarouwa.conf /etc/nginx/sites-available/lahiyarouwadayaro.com
   sudo ln -s /etc/nginx/sites-available/lahiyarouwadayaro.com /etc/nginx/sites-enabled/
   ```

4. **Premier déploiement**, depuis la racine du repo, sur votre poste :

   ```bash
   ./website/deploy/deploy.sh user@IP
   ```

   puis sur le VPS :

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. **HTTPS** (une fois que le DNS pointe bien sur le VPS) :

   ```bash
   sudo certbot --nginx -d lahiyarouwadayaro.com -d www.lahiyarouwadayaro.com --redirect
   ```

   Certbot ajoute le bloc 443 et la redirection HTTP → HTTPS, et renouvelle le certificat automatiquement.

## Mises à jour

```bash
./website/deploy/deploy.sh user@IP
```

Chaque déploiement crée une nouvelle release puis bascule le lien `current` d'un coup, sans coupure. Pour revenir en arrière :
`ln -sfn /var/www/lahiyarouwadayaro.com/releases/<ancienne> /var/www/lahiyarouwadayaro.com/current`.

Si vous modifiez la politique de confidentialité, mettez aussi à jour la date « Dernière mise à jour » en haut de la page et dans `sitemap.xml`.

## À ajuster avant / après la publication sur le Play Store

- **Bouton Google Play** : le lien pointe déjà vers `https://play.google.com/store/apps/details?id=com.sahelconnect.lahiyarouwa`. Il affichera une erreur 404 tant que l'app n'est pas publiée. Après la publication, remplacez « Bientôt sur » par « Disponible sur » dans `index.html`.
- **Adresse de contact** : `contact@lahiyarouwadayaro.com` doit exister et être consultée (Google et les utilisatrices s'en servent pour les demandes de suppression).
