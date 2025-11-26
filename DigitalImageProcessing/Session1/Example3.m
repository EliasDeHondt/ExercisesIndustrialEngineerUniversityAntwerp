% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 3
IM1 = imread('baboon.jpg');
IM2 = imread('jail.jpg');
IM2 = imresize(IM2, size(IM1(:,:,1)));
IM1_gray = rgb2gray(IM1);
IM2_gray = rgb2gray(IM2);
baboon_double = im2double(IM1_gray) * 2;
jail_half = im2double(IM2_gray) * 0.5;
added_image = baboon_double + jail_half;
added_image = mat2gray(added_image); 


% 3.1. Upper left: baboon grayscale
subplot(2,2,1)
subimage(IM1_gray)
title('Baboon Grayscale')


% 3.2. Upper right: jail grayscale
subplot(2,2,2)
subimage(IM2_gray)
title('Jail Grayscale')


% 3.4. Bottom left: baboon double intensity
subplot(2,2,3)
subimage(baboon_double)
title('Baboon Double Intensity')


% 3.5. Bottom right: jail half + baboon
subplot(2,2,4)
subimage(added_image)
title('Half Jail + Baboon (Brighter)')