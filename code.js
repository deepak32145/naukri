// 1192. Critical Connections in a Network
// Tarjan's Bridge Finding Algorithm
// Time: O(V + E) | Space: O(V + E)

/**
 * @param {number} n
 * @param {number[][]} connections
 * @return {number[][]}
 */
var criticalConnections = function (n, connections) {
    // Build adjacency list
    const graph = Array.from({ length: n }, () => []);
    for (const [u, v] of connections) {
        graph[u].push(v);
        graph[v].push(u);
    }

    const disc = new Array(n).fill(-1); // discovery time
    const low = new Array(n).fill(-1);  // lowest disc reachable
    const result = [];
    let timer = 0;

    function dfs(node, parent) {
        disc[node] = low[node] = timer++;

        for (const neighbor of graph[node]) {
            if (neighbor === parent) continue; // skip the edge we came from

            if (disc[neighbor] === -1) {
                // Tree edge — neighbor not yet visited
                dfs(neighbor, node);
                low[node] = Math.min(low[node], low[neighbor]);

                // Bridge condition
                if (low[neighbor] > disc[node]) {
                    result.push([node, neighbor]);
                }
            } else {
                // Back edge — neighbor already visited
                low[node] = Math.min(low[node], disc[neighbor]);
            }
        }
    }

    for (let i = 0; i < n; i++) {
        if (disc[i] === -1) dfs(i, -1);
    }

    return result;
};
