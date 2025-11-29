% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 4: Adjusting The Contrast Of An Image
pollen_cs = 1 ./ (1 + (0.5 ./ pollen).^5);
bone_cs   = 1 ./ (1 + (0.5 ./ bone).^5);
pollen_d = im2double(pollen);
pollen_log = mat2gray(log(1+pollen_d));
bone_log   = mat2gray(log(1+im2double(bone)));
figure,
subplot(2,3,1), imshow(pollen), title('Original pollen');
subplot(2,3,2), imshow(pollen_cs), title('Contrast stretched');
subplot(2,3,3), imshow(pollen_log), title('Log transformed');
subplot(2,3,4), imshow(bone), title('Original bone');
subplot(2,3,5), imshow(bone_cs), title('Contrast stretched');
subplot(2,3,6), imshow(bone_log), title('Log transformed');
disp(pollen(100,200));
disp(pollen_log(100,200));
disp(pollen_cs(100,200));