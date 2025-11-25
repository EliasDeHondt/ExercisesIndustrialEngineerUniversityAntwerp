% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 1
IM = imread('baboon.jpg');

% 1.1. What is the effect of following command?
IM(10:50,30:150)=255; % Set a rectangular region to red.
imshow(IM);


% 1.2. Create an image IM1 so all intensities of IM are halved.
IM1 = IM / 2;
imshow(IM1);


% 1.3. Create an image IM2 so all intensities of IM are tripled. Compare both images. What happens when the intensities exceed 255?
% When intensities exceed 255, they are clipped to 255, resulting in loss of detail in bright areas.
IM2 = IM * 3;
imshow(IM2);