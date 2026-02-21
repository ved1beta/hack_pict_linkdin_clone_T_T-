/**
 * GitHub API helpers: pinned repos, user's commits only, profile data
 */

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

function headers() {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "HEXjuy-Career-Platform",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  };
}

export interface PinnedRepo {
  owner: string;
  repo: string;
  name: string;
  url: string;
}

/**
 * Fetch user's pinned repositories via GraphQL (requires GITHUB_TOKEN for GraphQL)
 * Fallback: fetch top repos by stars/updated if no token
 */
export async function fetchPinnedRepos(username: string, limit = 3): Promise<PinnedRepo[]> {
  if (process.env.GITHUB_TOKEN) {
    const query = `
      query($login: String!) {
        user(login: $login) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                name
                nameWithOwner
                url
              }
            }
          }
        }
      }
    `;
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        ...headers(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });
    if (res.ok) {
      const data = await res.json();
      const nodes = data?.data?.user?.pinnedItems?.nodes || [];
      return nodes.slice(0, limit).map((n: any) => {
        const [owner, repo] = (n.nameWithOwner || `${username}/${n.name}`).split("/");
        return {
          owner: owner || username,
          repo: repo || n.name,
          name: n.name,
          url: n.url || `https://github.com/${owner}/${repo}`,
        };
      });
    }
  }

  // Fallback: fetch user's repos sorted by stars
  const res = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?sort=stars&per_page=${limit}`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  const repos = await res.json();
  return repos.slice(0, limit).map((r: any) => ({
    owner: r.owner?.login || username,
    repo: r.name,
    name: r.name,
    url: r.html_url || `https://github.com/${r.owner?.login}/${r.name}`,
  }));
}

export interface UserCommit {
  sha: string;
  message: string;
  date: string;
  url: string;
}

/**
 * Fetch only the user's commits in a repo (filters by author=username)
 */
export async function fetchUserCommits(
  owner: string,
  repo: string,
  username: string,
  perPage = 30
): Promise<UserCommit[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits?author=${encodeURIComponent(username)}&per_page=${perPage}`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  const commits = await res.json();
  return commits.map((c: any) => ({
    sha: c.sha,
    message: c.commit?.message || "",
    date: c.commit?.author?.date || "",
    url: c.html_url || "",
  }));
}