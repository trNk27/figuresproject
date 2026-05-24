// TrailMark Static Mock API & LocalStorage Database Interceptor
// Emulates PostgreSQL/Vercel serverless environment in the browser when offline or on static hosts.

(function () {
  const _originalFetch = window.fetch;
  
  // Determine environment
  let useMockDb = false;
  const isStaticHost = window.location.hostname.includes('github.io') || 
                       window.location.protocol === 'file:' || 
                       window.location.hostname.includes('localhost') || 
                       localStorage.getItem('tm_use_mock') === 'true';

  if (isStaticHost) {
    useMockDb = true;
    initMockDb();
  }

  // Pre-seed mock database if empty
  function initMockDb() {
    if (!localStorage.getItem('tm_users')) {
      const seedUsers = [
        {
          id: 1,
          username: "waidmann_tobi",
          display_name: "Tobias Huber",
          email: "tobias@trailmark.at",
          bio: "Berufsjäger in den Kitzbüheler Alpen. Jagdhundeführer & Naturfotograf. 🌲🦌 Dachsbracke 'Basko'.",
          location: "Kitzbühel, Tirol",
          equipment: "Blaser R8 Professional Success · .308 Win\nSwarovski Optik dG 8x42\nHunter Jagdfunk",
          avatar_url: null,
          is_private: false
        },
        {
          id: 2,
          username: "pirsch_anna",
          display_name: "Anna Brandner",
          email: "anna@trailmark.at",
          bio: "Waidweib aus Leidenschaft. Ansitzjagd auf Reh- und Rotwild in der wunderschönen Steiermark. 🌿🦊",
          location: "Schladming, Steiermark",
          equipment: "Steyr Mannlicher CL II · 6.5 Creedmoor\nKahles Helia 2.4-12x56i\nHärkila Bekleidung",
          avatar_url: null,
          is_private: false
        },
        {
          id: 3,
          username: "bergjagd_franz",
          display_name: "Franz Klammer",
          email: "franz@trailmark.at",
          bio: "Bergjagd auf Gams und Steinbock. Jagdhüttenwirt. Waidmannsheil! 🏔️🐐",
          location: "Heiligenblut, Kärnten",
          equipment: "Merkel K5 Kipplaufbüchse · 7mm Rem Mag\nLeica Geovid Pro 10x42\nLodenrucksack",
          avatar_url: null,
          is_private: true
        }
      ];
      localStorage.setItem('tm_users', JSON.stringify(seedUsers));
    }

    if (!localStorage.getItem('tm_harvests')) {
      const seedHarvests = [
        {
          id: 101,
          user_id: 1,
          species: "Rehbock",
          date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
          distance_yards: 145,
          cartridge: ".308 Win",
          wind_mph: 8,
          location: "Kitzbühel, Tirol",
          notes: "Jährling bei Kaiserwetter am Waldrand erlegt. Lag im Feuer.",
          is_public: true,
          hit_x: 52.5,
          hit_y: 44.8,
          escape_distance_meters: 0,
          created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 102,
          user_id: 2,
          species: "Wildschwein",
          date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
          distance_yards: 75,
          cartridge: "6.5 Creedmoor",
          wind_mph: 3,
          location: "Schladming, Steiermark",
          notes: "Überläuferkeiler an der Kirrung im Mondlicht. Perfekter Kammerschuss, kurze Fluchtstrecke.",
          is_public: true,
          hit_x: 44.2,
          hit_y: 48.6,
          escape_distance_meters: 35,
          created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 103,
          user_id: 3,
          species: "Gamsbock",
          date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
          distance_yards: 210,
          cartridge: "7mm Rem Mag",
          wind_mph: 15,
          location: "Großglockner, Kärnten",
          notes: "Steiler Schuss bergauf auf einen reifen Gamsbock. Schwieriger Wind.",
          is_public: true,
          hit_x: 55.8,
          hit_y: 42.1,
          escape_distance_meters: 15,
          created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
        }
      ];
      localStorage.setItem('tm_harvests', JSON.stringify(seedHarvests));
    }

    if (!localStorage.getItem('tm_posts')) {
      const seedPosts = [
        {
          id: 201,
          user_id: 2,
          body: "Konnte gestern Abend diesen strammen Überläuferkeiler erlegen! 🐗 Die Kirrjagd bei Vollmond hat sich gelohnt. Waidmannsheil an alle Pirschgänger!",
          image_url: null,
          harvest_id: 102,
          created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 202,
          user_id: 1,
          body: "Traumhafter Morgenansitz in den Kitzbüheler Alpen. Der Nebel verzieht sich langsam aus den Tälern... Die Natur erwacht! 🌲🏔️🦌",
          image_url: null,
          harvest_id: 101,
          created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
        }
      ];
      localStorage.setItem('tm_posts', JSON.stringify(seedPosts));
    }

    if (!localStorage.getItem('tm_likes')) {
      const seedLikes = [
        { post_id: 201, user_id: 1 },
        { post_id: 202, user_id: 2 }
      ];
      localStorage.setItem('tm_likes', JSON.stringify(seedLikes));
    }

    if (!localStorage.getItem('tm_comments')) {
      const seedComments = [
        {
          id: 301,
          post_id: 201,
          user_id: 1,
          body: "Kräftiges Waidmannsheil, Anna! Ein wirklich toller Keiler. Saubere Arbeit!",
          created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
        },
        {
          id: 302,
          post_id: 201,
          user_id: 2,
          body: "Waidmannsdank, Tobias! Es war extrem spannend.",
          created_at: new Date(Date.now() - 19 * 3600 * 1000).toISOString()
        }
      ];
      localStorage.setItem('tm_comments', JSON.stringify(seedComments));
    }

    if (!localStorage.getItem('tm_follows')) {
      const seedFollows = [
        { follower_id: 1, following_id: 2 },
        { follower_id: 2, following_id: 1 },
        { follower_id: 1, following_id: 3 },
        { follower_id: 2, following_id: 3 }
      ];
      localStorage.setItem('tm_follows', JSON.stringify(seedFollows));
    }

    if (!localStorage.getItem('tm_current_user_id')) {
      // Default log in as Tobias Huber (@waidmann_tobi) for easy initial static run
      localStorage.setItem('tm_current_user_id', '1');
    }
  }

  // Intercept window.fetch
  window.fetch = async function (url, options = {}) {
    // If mock mode is disabled or it's an external open-meteo or other API, use real network fetch
    if (!useMockDb || !url.startsWith('/api/')) {
      try {
        const response = await _originalFetch(url, options);
        // If a real database server responds with a connection error or 500, we fallback to local storage
        if (!response.ok && response.status >= 500) {
          console.warn("Real database server returned error, falling back to Local Mock Database!");
          useMockDb = true;
          initMockDb();
          return window.fetch(url, options);
        }
        return response;
      } catch (err) {
        console.warn("Real database server unreachable, falling back to Local Mock Database!", err);
        useMockDb = true;
        initMockDb();
        return window.fetch(url, options);
      }
    }

    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : null;
    
    // Parse URL path and query params
    const origin = window.location.origin;
    const parsedUrl = new URL(url, origin);
    const pathname = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams.entries());

    const getDBTable = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveDBTable = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const mockResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const getCurrentUserId = () => parseInt(localStorage.getItem('tm_current_user_id') || '0');

    try {
      // 1. GET /api/auth/me
      if (pathname === '/api/auth/me') {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return mockResponse({ error: 'Not authenticated' }, 401);

        const users = getDBTable('tm_users');
        const user = users.find(u => u.id === currentUserId);
        if (!user) return mockResponse({ error: 'User not found' }, 401);

        const follows = getDBTable('tm_follows');
        const harvests = getDBTable('tm_harvests');

        user.followers_count = follows.filter(f => f.following_id === user.id).length;
        user.following_count = follows.filter(f => f.follower_id === user.id).length;
        user.harvest_count = harvests.filter(h => h.user_id === user.id).length;

        if (method === 'GET') {
          return mockResponse({ user });
        }

        if (method === 'PATCH') {
          Object.assign(user, body);
          saveDBTable('tm_users', users);
          return mockResponse({ user });
        }
      }

      // 2. POST /api/auth/login
      if (pathname === '/api/auth/login' && method === 'POST') {
        const { login, password } = body;
        const users = getDBTable('tm_users');
        const user = users.find(u => u.username === login || u.email === login);
        
        if (!user) return mockResponse({ error: 'Ungültiger Benutzername oder E-Mail.' }, 400);
        
        // Simulating matching logins (passwords skipped in mock engine for accessibility)
        localStorage.setItem('tm_current_user_id', user.id.toString());
        return mockResponse({ user });
      }

      // 3. POST /api/auth/register
      if (pathname === '/api/auth/register' && method === 'POST') {
        const { username, display_name, email, password } = body;
        const users = getDBTable('tm_users');

        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
          return mockResponse({ error: 'Benutzername bereits vergeben.' }, 400);
        }
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return mockResponse({ error: 'E-Mail-Adresse bereits registriert.' }, 400);
        }

        const newUser = {
          id: Date.now(),
          username,
          display_name: display_name || username,
          email,
          bio: '',
          location: '',
          equipment: '',
          avatar_url: null,
          is_private: false
        };

        users.push(newUser);
        saveDBTable('tm_users', users);
        localStorage.setItem('tm_current_user_id', newUser.id.toString());
        return mockResponse({ user: newUser });
      }

      // 4. POST /api/auth/logout
      if (pathname === '/api/auth/logout' && method === 'POST') {
        localStorage.removeItem('tm_current_user_id');
        return mockResponse({ ok: true });
      }

      // 5. GET/POST/DELETE /api/harvests
      if (pathname === '/api/harvests') {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return mockResponse({ error: 'Not authenticated' }, 401);

        const harvests = getDBTable('tm_harvests');

        if (method === 'GET') {
          const userHarvests = harvests
            .filter(h => h.user_id === currentUserId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          return mockResponse({ harvests: userHarvests });
        }

        if (method === 'POST') {
          const newHarvest = {
            id: Date.now(),
            user_id: currentUserId,
            species: body.species,
            date: body.date,
            distance_yards: body.distance_yards ? parseInt(body.distance_yards) : null,
            cartridge: body.cartridge,
            wind_mph: body.wind_mph ? parseInt(body.wind_mph) : null,
            location: body.location,
            notes: body.notes,
            is_public: body.is_public !== false,
            hit_x: body.hit_x ? parseFloat(body.hit_x) : null,
            hit_y: body.hit_y ? parseFloat(body.hit_y) : null,
            escape_distance_meters: body.escape_distance_meters ? parseInt(body.escape_distance_meters) : null,
            created_at: new Date().toISOString()
          };

          harvests.push(newHarvest);
          saveDBTable('tm_harvests', harvests);
          return mockResponse({ harvest: newHarvest });
        }

        if (method === 'DELETE') {
          const id = parseInt(query.id);
          const updatedHarvests = harvests.filter(h => !(h.id === id && h.user_id === currentUserId));
          saveDBTable('tm_harvests', updatedHarvests);
          return mockResponse({ ok: true });
        }
      }

      // 6. GET/POST /api/posts
      if (pathname === '/api/posts') {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return mockResponse({ error: 'Not authenticated' }, 401);

        const posts = getDBTable('tm_posts');
        const users = getDBTable('tm_users');
        const harvests = getDBTable('tm_harvests');
        const likes = getDBTable('tm_likes');
        const comments = getDBTable('tm_comments');
        const follows = getDBTable('tm_follows');

        if (method === 'GET') {
          // Get list of users the current user follows plus themselves
          const followingIds = follows.filter(f => f.follower_id === currentUserId).map(f => f.following_id);
          const visibleUserIds = [currentUserId, ...followingIds];

          // Filter posts: show posts from self, followed users, or public posts
          const visiblePosts = posts
            .filter(p => {
              const author = users.find(u => u.id === p.user_id);
              if (!author) return false;
              // Visible if author in visible list, OR if author is public
              return visibleUserIds.includes(p.user_id) || !author.is_private;
            })
            .map(p => {
              const author = users.find(u => u.id === p.user_id) || { username: 'deleted', display_name: 'Deleted' };
              const harvest = p.harvest_id ? harvests.find(h => h.id === p.harvest_id) : null;

              return {
                id: p.id,
                body: p.body,
                image_url: p.image_url,
                created_at: p.created_at,
                author_id: p.user_id,
                username: author.username,
                display_name: author.display_name,
                avatar_url: author.avatar_url,
                harvest_id: p.harvest_id,
                species: harvest?.species || null,
                distance_yards: harvest?.distance_yards || null,
                cartridge: harvest?.cartridge || null,
                harvest_location: harvest?.location || null,
                hit_x: harvest?.hit_x || null,
                hit_y: harvest?.hit_y || null,
                escape_distance_meters: harvest?.escape_distance_meters || null,
                like_count: likes.filter(l => l.post_id === p.id).length,
                comment_count: comments.filter(c => c.post_id === p.id).length,
                liked_by_me: likes.some(l => l.post_id === p.id && l.user_id === currentUserId)
              };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          return mockResponse({ posts: visiblePosts });
        }

        if (method === 'POST') {
          const newPost = {
            id: Date.now(),
            user_id: currentUserId,
            body: body.body,
            image_url: body.image_url,
            harvest_id: body.harvest_id ? parseInt(body.harvest_id) : null,
            created_at: new Date().toISOString()
          };

          posts.push(newPost);
          saveDBTable('tm_posts', posts);
          return mockResponse({ post: newPost }, 201);
        }
      }

      // 7. POST /api/likes
      if (pathname === '/api/likes' && method === 'POST') {
        const currentUserId = getCurrentUserId();
        const { post_id } = body;
        const likes = getDBTable('tm_likes');

        const index = likes.findIndex(l => l.post_id === post_id && l.user_id === currentUserId);
        let liked = false;
        
        if (index === -1) {
          likes.push({ post_id, user_id: currentUserId });
          liked = true;
        } else {
          likes.splice(index, 1);
        }
        
        saveDBTable('tm_likes', likes);
        const count = likes.filter(l => l.post_id === post_id).length;
        return mockResponse({ liked, count });
      }

      // 8. GET/POST/DELETE /api/posts/[id] -> matches /api/posts/(\d+)
      const postMatch = pathname.match(/^\/api\/posts\/(\d+)$/);
      if (postMatch) {
        const postId = parseInt(postMatch[1]);
        const currentUserId = getCurrentUserId();
        const comments = getDBTable('tm_comments');
        const users = getDBTable('tm_users');

        if (method === 'GET') {
          const postComments = comments
            .filter(c => c.post_id === postId)
            .map(c => {
              const author = users.find(u => u.id === c.user_id) || { username: 'deleted', display_name: 'Deleted' };
              return {
                id: c.id,
                body: c.body,
                created_at: c.created_at,
                author_id: c.user_id,
                username: author.username,
                display_name: author.display_name,
                avatar_url: author.avatar_url
              };
            })
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          return mockResponse({ comments: postComments });
        }

        if (method === 'POST') {
          const newComment = {
            id: Date.now(),
            post_id: postId,
            user_id: currentUserId,
            body: body.body,
            created_at: new Date().toISOString()
          };

          comments.push(newComment);
          saveDBTable('tm_comments', comments);
          return mockResponse({ comment: newComment }, 201);
        }

        if (method === 'DELETE') {
          const commentId = parseInt(query.comment);
          if (commentId) {
            const updatedComments = comments.filter(c => !(c.id === commentId && c.user_id === currentUserId));
            saveDBTable('tm_comments', updatedComments);
            return mockResponse({ ok: true });
          } else {
            const posts = getDBTable('tm_posts');
            const updatedPosts = posts.filter(p => !(p.id === postId && p.user_id === currentUserId));
            saveDBTable('tm_posts', updatedPosts);
            return mockResponse({ ok: true });
          }
        }
      }

      // 9. GET /api/users/[username]
      const userMatch = pathname.match(/^\/api\/users\/([^\/]+)$/);
      if (userMatch) {
        const username = decodeURIComponent(userMatch[1]);
        const currentUserId = getCurrentUserId();
        const users = getDBTable('tm_users');
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (!user) return mockResponse({ error: 'User not found' }, 404);

        const follows = getDBTable('tm_follows');
        const harvests = getDBTable('tm_harvests');

        user.followers_count = follows.filter(f => f.following_id === user.id).length;
        user.following_count = follows.filter(f => f.follower_id === user.id).length;
        user.harvest_count = harvests.filter(h => h.user_id === user.id).length;
        user.is_following = follows.some(f => f.follower_id === currentUserId && f.following_id === user.id);

        if (query.view === 'followers') {
          const followerIds = follows.filter(f => f.following_id === user.id).map(f => f.follower_id);
          const followerUsers = users.filter(u => followerIds.includes(u.id)).map(u => {
            u.is_following = follows.some(f => f.follower_id === currentUserId && f.following_id === u.id);
            return u;
          });
          return mockResponse({ users: followerUsers });
        }

        if (query.view === 'following') {
          const followingIds = follows.filter(f => f.follower_id === user.id).map(f => f.following_id);
          const followingUsers = users.filter(u => followingIds.includes(u.id)).map(u => {
            u.is_following = follows.some(f => f.follower_id === currentUserId && f.following_id === u.id);
            return u;
          });
          return mockResponse({ users: followingUsers });
        }

        if (query.view === 'posts') {
          // If profile is private and we aren't following and it's not our own profile, hide posts
          if (user.is_private && !user.is_following && user.id !== currentUserId) {
            return mockResponse({ private: true, posts: null });
          }

          const posts = getDBTable('tm_posts');
          const likes = getDBTable('tm_likes');
          const comments = getDBTable('tm_comments');

          const userPosts = posts
            .filter(p => p.user_id === user.id)
            .map(p => {
              const harvest = p.harvest_id ? harvests.find(h => h.id === p.harvest_id) : null;
              return {
                id: p.id,
                body: p.body,
                image_url: p.image_url,
                created_at: p.created_at,
                author_id: p.user_id,
                username: user.username,
                display_name: user.display_name,
                avatar_url: user.avatar_url,
                harvest_id: p.harvest_id,
                species: harvest?.species || null,
                distance_yards: harvest?.distance_yards || null,
                cartridge: harvest?.cartridge || null,
                harvest_location: harvest?.location || null,
                hit_x: harvest?.hit_x || null,
                hit_y: harvest?.hit_y || null,
                escape_distance_meters: harvest?.escape_distance_meters || null,
                like_count: likes.filter(l => l.post_id === p.id).length,
                comment_count: comments.filter(c => c.post_id === p.id).length,
                liked_by_me: likes.some(l => l.post_id === p.id && l.user_id === currentUserId)
              };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          return mockResponse({ posts: userPosts });
        }

        return mockResponse({ user });
      }

      // 10. GET /api/users/search
      if (pathname === '/api/users/search') {
        const q = (query.q || '').toLowerCase();
        const currentUserId = getCurrentUserId();
        const users = getDBTable('tm_users');
        const follows = getDBTable('tm_follows');

        const searchResults = users
          .filter(u => u.username.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q))
          .map(u => {
            u.followers_count = follows.filter(f => f.following_id === u.id).length;
            u.is_following = follows.some(f => f.follower_id === currentUserId && f.following_id === u.id);
            return u;
          });

        return mockResponse({ users: searchResults });
      }

      // 11. POST /api/follows
      if (pathname === '/api/follows' && method === 'POST') {
        const currentUserId = getCurrentUserId();
        const { target_id } = body;
        const follows = getDBTable('tm_follows');

        const index = follows.findIndex(f => f.follower_id === currentUserId && f.following_id === target_id);
        let following = false;

        if (index === -1) {
          follows.push({ follower_id: currentUserId, following_id: target_id });
          following = true;
        } else {
          follows.splice(index, 1);
        }

        saveDBTable('tm_follows', follows);
        return mockResponse({ following });
      }

      // 12. POST /api/upload
      if (pathname === '/api/upload' && method === 'POST') {
        // Return base64 payload as-is. In HTML this renders natively as data:image/jpeg;base64,...
        return mockResponse({ url: body.data });
      }

      return mockResponse({ error: 'Endpoint not found' }, 404);
    } catch (e) {
      console.error("Mock Server Error", e);
      return mockResponse({ error: 'Mock database server error' }, 500);
    }
  };

  console.log("TrailMark Mock API Interceptor Loaded successfully. Static mode: " + useMockDb);
})();
