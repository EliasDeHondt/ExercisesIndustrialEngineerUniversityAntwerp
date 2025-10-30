% Theorie05_noToolbox.m
% Compute binomial probabilities without Statistics Toolbox

% Parameters
n = 20;
p = 0.10;

% a) Probability of exactly 2 underprivileged children
k_a = 2;
P_exact_2 = nchoosek(n, k_a) * p^k_a * (1 - p)^(n - k_a);

% b) Probability of at most 3 underprivileged children
k_b = 3;
P_max_3 = 0;
for k = 0:k_b
    P_max_3 = P_max_3 + nchoosek(n, k) * p^k * (1 - p)^(n - k);
end

% c) Find smallest k such that P(X <= k) >= 0.90
cdf_val = 0;
for k = 0:n
    cdf_val = cdf_val + nchoosek(n, k) * p^k * (1 - p)^(n - k);
    if cdf_val >= 0.90
        k_c = k;
        break;
    end
end

% Print results
fprintf('Parameters: n = %d, p = %.2f\n\n', n, p);
fprintf('a) P(X = %d) = %.6f (%.4f%%)\n', k_a, P_exact_2, P_exact_2 * 100);
fprintf('b) P(X <= %d) = %.6f (%.4f%%)\n', k_b, P_max_3, P_max_3 * 100);
fprintf('c) Smallest k with P(X <= k) >= 0.90 is k = %d\n', k_c);
fprintf('   Cumulative probability = %.6f (%.4f%%)\n', cdf_val, cdf_val * 100);