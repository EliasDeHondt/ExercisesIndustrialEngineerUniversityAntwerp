% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 5

% 5.1. Define the matrix and the color map
X = [1 2 3; 3 1 2; 2 3 1];
X_map1 = [1 0 0;   % red
         0 1 0;   % green
         0 0 1];  % blue


% 5.2. Display the image with the color map
figure;
imshow(X, X_map1, 'InitialMagnification', 'fit');
title('Original X with X\_map');


% 5.3. Try other color maps
X_map2 = [1 1 0;   % yellow
          0 1 1;   % cyan
          1 0 1];  % magenta

figure;
imshow(X, X_map2, 'InitialMagnification', 'fit');
title('X with custom color map (yellow, cyan, magenta)');