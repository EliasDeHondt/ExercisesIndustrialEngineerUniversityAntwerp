% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 2
brokentext = imread('broken-text.tif');
text = bwareaopen(~brokentext, 20);
text = ~text;
se = strel('disk', 1);
text = imclose(text, se);
figure;
subplot(1,2,1);
imshow(brokentext);
title('Original');
subplot(1,2,2);
imshow(text);
title('Clean');